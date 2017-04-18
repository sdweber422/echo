import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {Player, r} from 'src/server/services/dataService'
import {computePlayerLevel} from 'src/server/util/stats'
import {avg} from 'src/server/util'
import {LGBadRequestError} from 'src/server/util/error'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
} = STAT_DESCRIPTORS

const MAX_RECENT_PROJECTS_TO_CONSIDER = 100
const MAX_CYCLES_IN_WEIGHTED_AVERAGE = 6

export default async function savePlayerProjectStats(playerId, projectId, playerStatsForProject = {}) {
  const player = await Player.get(playerId)

  const oldPlayerStats = Object.assign({}, player.stats || {})
  const oldPlayerProjectStats = Object.assign({}, oldPlayerStats.projects || {})
  const oldPlayerStatsForProject = Object.assign({}, oldPlayerProjectStats[projectId] || {})

  const newPlayerStatsForProject = Object.assign({}, oldPlayerStatsForProject, playerStatsForProject)
  const newPlayerProjectStats = Object.assign({}, oldPlayerProjectStats, {[projectId]: newPlayerStatsForProject})
  const newPlayerStats = Object.assign({}, oldPlayerStats, {
    [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: _computeCumulativeStat(oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject, RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES),
    [EXPERIENCE_POINTS]: _computeCumulativeStat(oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject, EXPERIENCE_POINTS),
    [ELO]: playerStatsForProject[ELO] ? {
      rating: playerStatsForProject[ELO].rating,
      matches: playerStatsForProject[ELO].matches,
    } : null,
    projects: newPlayerProjectStats,
    weightedAverages: await _computePlayerStatsWeightedAverages(newPlayerProjectStats),
  })

  // use updated top-level stats to determine new level
  const oldLevel = oldPlayerStats[LEVEL] || 0
  const newLevel = await computePlayerLevel(newPlayerStats)
  if (newLevel === null) {
    throw new LGBadRequestError(`Could not place player ${playerId} in a level`)
  }
  newPlayerStats[LEVEL] = newLevel
  newPlayerStats.projects[projectId][LEVEL] = {starting: oldLevel, ending: newLevel}

  return Player.get(playerId).updateWithTimestamp({
    stats: newPlayerStats,
    statsComputedAt: r.now(),
  })
}

function _computeCumulativeStat(oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject, statDescriptor) {
  const oldStatValue = oldPlayerStats[statDescriptor] || 0
  const oldProjectStatValue = oldPlayerStatsForProject[statDescriptor] || 0
  const newProjectStatValue = newPlayerStatsForProject[statDescriptor] || 0
  return oldStatValue - oldProjectStatValue + newProjectStatValue
}

async function _computePlayerStatsWeightedAverages(playerProjectStats) {
  const recentProjectStats = await _getRecentProjectStats(playerProjectStats, MAX_RECENT_PROJECTS_TO_CONSIDER)
  const recentProjectStatValues = recentProjectStats.reduce((result, next) => {
    for (const [k, v] of Object.entries(next)) {
      if (typeof v === 'number') {
        result[k] = result[k] || []
        result[k].push(v)
      }
    }
    return result
  }, {})

  const weightedAverages = {}
  for (const [stat, values] of Object.entries(recentProjectStatValues)) {
    weightedAverages[stat] = avg(values.slice(0, MAX_CYCLES_IN_WEIGHTED_AVERAGE))
  }
  return weightedAverages
}

async function _getRecentProjectStats(playerProjectStats, maxProjectCount) {
  // FIXME: this can be cleaner with a join model/table, PlayerProjectStats
  const projectIds = Object.keys(playerProjectStats)
  const recentProjectsByCreatedAt = await r.table('projects')
    .getAll(...projectIds)
    .eqJoin('cycleId', r.table('cycles'))
    .orderBy(r.desc(join => join('right')('cycleNumber')))
    .limit(maxProjectCount)('left')('id')
  return recentProjectsByCreatedAt.map(projectId => playerProjectStats[projectId])
}
