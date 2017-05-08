import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {Player, r} from 'src/server/services/dataService'
import {computePlayerLevel, computePlayerLevelV2} from 'src/server/util/stats'
import {avg} from 'src/server/util'

const {
  ELO,
  EXPERIENCE_POINTS,
  EXPERIENCE_POINTS_V2,
  LEVEL,
  LEVEL_V2,
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
    [EXPERIENCE_POINTS]: _computeCumulativeStat(EXPERIENCE_POINTS, oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject),
    [EXPERIENCE_POINTS_V2]: _computeCumulativeStat(EXPERIENCE_POINTS_V2, oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject),
    [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: _computeCumulativeStat(RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES, oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject),
    projects: newPlayerProjectStats,
    weightedAverages: await _computePlayerStatsWeightedAverages(newPlayerProjectStats),
  })
  if (playerStatsForProject[ELO]) {
    // for Elo rating, project-level stat becomes new overall stat
    newPlayerStats[ELO] = {
      rating: playerStatsForProject[ELO].rating,
      matches: playerStatsForProject[ELO].matches,
    }
  }

  // use updated top-level stats to determine new level
  const oldLevel = oldPlayerStats[LEVEL] || 0
  const newLevel = await computePlayerLevel(newPlayerStats)
  newPlayerStats[LEVEL] = newLevel
  newPlayerStats.projects[projectId][LEVEL] = {starting: oldLevel, ending: newLevel}

  if (Number.isFinite(newPlayerStatsForProject[EXPERIENCE_POINTS_V2])) {
    const oldLevelV2 = oldPlayerStats[LEVEL_V2] || 0
    const newLevelV2 = await computePlayerLevelV2(newPlayerStats)
    newPlayerStats[LEVEL_V2] = newLevelV2
    newPlayerStats.projects[projectId][LEVEL_V2] = {starting: oldLevelV2, ending: newLevelV2}
  }

  return Player.get(playerId).updateWithTimestamp({
    stats: newPlayerStats,
    statsComputedAt: r.now(),
  })
}

function _computeCumulativeStat(statDescriptor, oldPlayerStats, oldPlayerStatsForProject, newPlayerStatsForProject) {
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
