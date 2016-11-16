import {normalize, Schema} from 'normalizr'

import {
  flatten,
  getGraphQLFetcher,
} from 'src/common/util'
import loadUsers from './loadUsers'

export const LOAD_CYCLE_VOTING_RESULTS_REQUEST = 'LOAD_CYCLE_VOTING_RESULTS_REQUEST'
export const LOAD_CYCLE_VOTING_RESULTS_SUCCESS = 'LOAD_CYCLE_VOTING_RESULTS_SUCCESS'
export const LOAD_CYCLE_VOTING_RESULTS_FAILURE = 'LOAD_CYCLE_VOTING_RESULTS_FAILURE'
export const RECEIVED_CYCLE_VOTING_RESULTS = 'RECEIVED_CYCLE_VOTING_RESULTS'

const chapterSchema = new Schema('chapters')
const cycleSchema = new Schema('cycles')
cycleSchema.define({chapter: chapterSchema})
const cycleVotingResultsSchema = new Schema('cycleVotingResults')
cycleVotingResultsSchema.define({cycle: cycleSchema})

function receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults) {
  const response = normalize(cycleVotingResults, cycleVotingResultsSchema)
  return {type: RECEIVED_CYCLE_VOTING_RESULTS, response}
}

function loadCycleVotingResultsWithoutCorrespondingUsers() {
  return {
    types: [
      LOAD_CYCLE_VOTING_RESULTS_REQUEST,
      LOAD_CYCLE_VOTING_RESULTS_SUCCESS,
      LOAD_CYCLE_VOTING_RESULTS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query {
  getCycleVotingResults {
    cycle {
      id
      cycleNumber
      startTimestamp
      state
      chapter {
        id
        name
        channelName
        timezone
        goalRepositoryURL
        githubTeamId
        cycleDuration
        cycleEpoch
      }
    }
    pools {
      id
      voterPlayerIds
      users {
        id
      }
      votingIsStillOpen
      candidateGoals {
        goal {
          url
          title
        }
        playerGoalRanks {
          playerId
          goalRank
        }
      }
    }
  }
}
        `,
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => graphQLResponse.data.getCycleVotingResults)
        // Add "id" for this singleton for normalizr
        .then(cycleVotingResults => ({id: 'CURRENT', ...cycleVotingResults}))
        .then(cycleVotingResults => normalize(cycleVotingResults, cycleVotingResultsSchema))
    },
  }
}

function loadUsersForCycleVotingResults(dispatch, getState) {
  return () => {
    const {CURRENT: cycleVotingResults} = getState().cycleVotingResults.cycleVotingResults
    const playerIds = flatten(cycleVotingResults.pools.map(_ => _.users.map(_ => _.id)))
    return dispatch(loadUsers(playerIds))
  }
}

export function receivedCycleVotingResults(cycleVotingResults) {
  return (dispatch, getState) => {
    return dispatch(receivedCycleVotingResultsWithoutLoadingUsers(cycleVotingResults))
      .then(loadUsersForCycleVotingResults(dispatch, getState))
  }
}

export default function loadCycleVotingResults() {
  return (dispatch, getState) => {
    return dispatch(loadCycleVotingResultsWithoutCorrespondingUsers())
      .then(loadUsersForCycleVotingResults(dispatch, getState))
  }
}
