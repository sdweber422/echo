import r from 'src/db/connect'
import {updateInTable} from 'src/server/db/util'

export function getPlayerById(id, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const player = r.table('players').get(id)
  return r.branch(
    player.eq(null),
    player,
    options.mergeChapter ?
      player
        .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
        .without('chapterId') :
      player
  )
}

export function findPlayersByIds(playerIds) {
  return r.table('players').getAll(...playerIds)
}

export async function findPlayersByProjectId(projectId, cycleId) {
  const project = await r.table('projects').get(projectId).run()

  if (!project) {
    throw new Error(`Invalid project ID ${projectId}`)
  }
  if (!Array.isArray(project.cycleHistory)) {
    return []
  }

  const playerIds = project.cycleHistory.reduce((result, cycleData) => {
    if (cycleData && cycleData.playerIds && cycleData.playerIds.length) {
      if (!cycleId || cycleData.cycleId === cycleId) {
        return result.concat(cycleData.playerIds)
      }

      return result
    }
    return result
  }, [])

  return findPlayersByIds(playerIds)
}

export function savePlayerProjectStats(playerId, projectId, newStats = {}) {
  const playerStats = r.row('stats').default({})
  const playerProjectStats = playerStats('projects').default({})

  const mergedProjectStats = playerProjectStats.merge(projects => ({
    [projectId]: projects(projectId).default({}).merge(newStats)
  }))

  const updatedECC = _updatedSummaryStatExpr(projectId, newStats, 'ecc')
  const updatedXP = _updatedSummaryStatExpr(projectId, newStats, 'xp')

  const {elo = {}} = newStats
  const updatedElo = {
    rating: elo.rating,
    matches: elo.matches,
  }

  return update({
    id: playerId,
    stats: {
      ecc: updatedECC,
      elo: updatedElo,
      xp: updatedXP,
      projects: mergedProjectStats,
    }
  })
}

function _updatedSummaryStatExpr(projectId, newStats, statName) {
  const playerStats = r.row('stats').default({})
  const playerProjectStats = playerStats('projects').default({})
  const playerProjectValue = playerProjectStats(projectId).default({})(statName).default(0)
  const currentValue = playerStats(statName).default(0)
  const updatedValue = currentValue.sub(playerProjectValue).add(newStats[statName] || 0)

  return updatedValue
}

export function reassignPlayersToChapter(playerIds, chapterId) {
  const now = r.now()

  return r.table('players')
    .getAll(...playerIds)
    .filter(r.row('chapterId').ne(chapterId))
    .update({
      chapterId,
      chapterHistory: r.row('chapterHistory').default([]).insertAt(0, {chapterId: r.row('chapterId'), until: now}),
      updatedAt: now,
    }, {returnChanges: 'always'})
    .run()
    .then(updatedPlayers => {
      if (updatedPlayers.errors) {
        return Promise.reject(updatedPlayers.first_error)
      }
      if (updatedPlayers.replaced > 0) {
        return updatedPlayers.changes.map(change => change.new_val)
      }
      return []
    })
}

export function findPlayers(options) {
  const players = r.table('players')
  return options && options.filter ?
    players.filter(options.filter) :
    players
}

export function findPlayersForChapter(chapterId, filters) {
  return r.table('players')
    .getAll(chapterId, {index: 'chapterId'})
    .filter(filters || {})
}

export function getActivePlayersInChapter(chapterId) {
  return r.table('players')
    .getAll(chapterId, {index: 'chapterId'})
    .filter({active: true})
}

export function update(record, options) {
  return updateInTable(record, r.table('players'), options)
}
