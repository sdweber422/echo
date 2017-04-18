import {GOAL_SELECTION} from 'src/common/models/cycle'
import {
  Cycle,
  getLatestCycleForChapter,
  getPlayersInPool,
} from 'src/server/services/dataService'
import {connect} from 'src/db'

const r = connect()

export default async function getCycleVotingResults(chapterId, cycleId) {
  const cycle = cycleId ?
    await Cycle.get(cycleId).getJoin({chapter: true}) :
    await getLatestCycleForChapter(chapterId, {mergeChapter: true})

  const poolsExpr = r.table('pools')
    .getAll(cycle.id, {index: 'cycleId'})
    .orderBy('level')
  const pools = await poolsExpr
    .merge(_mergeCandidateGoals)
    .merge(_mergeUsers)
    .merge(_mergeVoterPlayerIds)
    .merge(_mergeVotingIsStillOpen(cycle))

  return {
    id: 'CURRENT', // TODO: make this the cycleId? Need an id for normalizr on the client-side
    cycle,
    pools,
  }
}

function _mergeCandidateGoals(pool) {
  const candidateGoals = _validVotesForPool(pool)
    .group(vote => vote('goals').pluck('url', 'title', 'number'), {multi: true})
    .ungroup()
    .map(doc => ({
      goal: doc('group'),
      playerGoalRanks: doc('reduction').map(vote => ({
        playerId: vote('playerId'),
        goalRank: vote('goals')('url').offsetsOf(doc('group')('url')).nth(0)
      }))
    }))
    .orderBy(r.desc(row => row('playerGoalRanks').count()))
  return {candidateGoals}
}

function _validVotesForPool(pool) {
  return r.table('votes')
    .getAll(pool('id'), {index: 'poolId'})
    .hasFields('goals')
}

function _mergeUsers(pool) {
  return {
    users: getPlayersInPool(pool('id')).coerceTo('array')
  }
}

function _mergeVoterPlayerIds(pool) {
  return {
    voterPlayerIds: pool('candidateGoals').concatMap(goal => goal('playerGoalRanks')('playerId')).distinct()
  }
}

function _mergeVotingIsStillOpen(cycle) {
  return {
    votingIsStillOpen: cycle.state === GOAL_SELECTION
  }
}
