import config from 'src/config'
import {GOAL_SELECTION} from 'src/common/models/cycle'
import {STAT_DESCRIPTORS, PRO_PLAYER_STATS_BASELINE} from 'src/common/models/stat'
import {addUserToTeam} from 'src/server/services/gitHubService'
import {logRejection} from 'src/server/util'
import {LEVELS, computePlayerLevel} from 'src/server/util/stats'
import {
  Chapter,
  Moderator,
  Player,
  PlayerPool,
  getLatestCycleForChapter,
  getPoolByCycleIdAndPlayerId,
  getPoolsForCycleWithPlayerCount,
} from 'src/server/services/dataService'

const GAME_USER_ROLES = {
  MODERATOR: 'moderator',
  PLAYER: 'player',
  SEP: 'sep',
}

const {
  ELO,
  ESTIMATION_ACCURACY,
  LEVEL,
} = STAT_DESCRIPTORS

// we want new players to start on level 1, but not act as
// if they have a higher estimation accuracy than current
// level 1 players
const DEFAULT_PLAYER_STATS = {
  [ELO]: {rating: 1000},
  weightedAverages: {
    [ESTIMATION_ACCURACY]: LEVELS[1].requirements[ESTIMATION_ACCURACY] + 0.01,
  },
}
DEFAULT_PLAYER_STATS[LEVEL] = computePlayerLevel(DEFAULT_PLAYER_STATS)

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('userCreated', processUserCreated)
}

export async function processUserCreated(idmUser) {
  try {
    if (!idmUser.inviteCode) {
      throw new Error(`Invalid invite code for user user with id ${idmUser.id}; unable to determine chapter assignment`)
    }

    const chapters = await Chapter.getAll(idmUser.inviteCode, {index: 'inviteCodes'})
    if (chapters.length === 0) {
      throw new Error(`no chapter found for inviteCode ${idmUser.inviteCode} on user with id ${idmUser.id}`)
    }

    const chapter = chapters[0]
    const user = {
      id: idmUser.id,
      chapterId: chapter.id,
    }

    if (_userHasRole(idmUser, GAME_USER_ROLES.MODERATOR)) {
      await Moderator.upsert(user)
    }

    if (_userHasRole(idmUser, GAME_USER_ROLES.PLAYER)) {
      const statsBaseline = _userHasRole(idmUser, GAME_USER_ROLES.SEP) ? PRO_PLAYER_STATS_BASELINE : {}
      const stats = {...DEFAULT_PLAYER_STATS, ...statsBaseline}
      const player = await Player.upsert({...user, stats, statsBaseline})

      await _addPlayerToPool(player)

      try {
        await _addUserToChapterGitHubTeam(idmUser.handle, chapter.githubTeamId)
      } catch (err) {
        console.error(`Unable to add player ${idmUser.id} to github team ${chapter.githubTeamId}: ${err}`)
      }

      try {
        await _notifyCRMSystemOfPlayerSignUp(idmUser)
      } catch (err) {
        console.error(`Unable to notify CRM of player signup for user ${idmUser.id}: ${err}`)
      }
    }
  } catch (err) {
    throw new Error(`Unable to save user updates ${idmUser.id}: ${err}`)
  }
}

async function _addPlayerToPool(player) {
  const cycle = await getLatestCycleForChapter(player.chapterId)
  if (cycle.state !== GOAL_SELECTION) {
    return
  }

  const cycleId = cycle.id
  const playerId = player.id
  const existingPool = await getPoolByCycleIdAndPlayerId(cycleId, playerId, {returnNullIfNoneFound: true})

  if (!existingPool) {
    const poolsInPlayerLevel = await getPoolsForCycleWithPlayerCount(cycleId).filter(_ => _('levels').contains(player.stats.level))
    poolsInPlayerLevel.sort((previousPool, currentPool) => previousPool.count - currentPool.count)
    await PlayerPool.save({playerId, poolId: poolsInPlayerLevel[0].id})
  } else {
    console.log(`Player ${playerId} has already been placed in cycle ${cycleId} pool ${existingPool.id}`)
  }
}

function _notifyCRMSystemOfPlayerSignUp(idmUser) {
  // TODO: move to IDM service
  const crmService = require('src/server/services/crmService')
  return config.server.crm.enabled === true ?
    logRejection(crmService.notifyContactSignedUp(idmUser.email), 'Error while contacting CRM System.') :
    Promise.resolve()
}

async function _addUserToChapterGitHubTeam(userHandle, githubTeamId) {
  console.log(`Adding ${userHandle} to GitHub team ${githubTeamId}`)
  return logRejection(addUserToTeam(userHandle, githubTeamId), 'Error while adding user to chapter GitHub team.')
}

function _userHasRole(idmUser, role) {
  if (!idmUser.roles || !Array.isArray(idmUser.roles)) {
    return false
  }
  return idmUser.roles.indexOf(role) >= 0
}
