import {GOAL_SELECTION} from 'src/common/models/cycle'

import r from '../r'
import getPlayersInPool from './getPlayersInPool'

export default function findPoolsForCycle(cycle) {
  const poolsExpr = r.table('pools')
    .getAll(cycle.id, {index: 'cycleId'})
    .orderBy('level')

  return poolsExpr
    .merge(_mergeCandidateGoals)
    .merge(_mergeUsers)
    .merge(_mergeVoterPlayerIds)
    .merge(_mergeVotingIsStillOpen(cycle))
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

function _validVotesForPool(pool) {
  return r.table('votes')
    .getAll(pool('id'), {index: 'poolId'})
    .hasFields('goals')
}
