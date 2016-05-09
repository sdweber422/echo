import {getGraphQLFetcher} from '../util'

export const LOAD_CYCLE_VOTING_RESULTS_REQUEST = 'LOAD_CYCLE_VOTING_RESULTS_REQUEST'
export const LOAD_CYCLE_VOTING_RESULTS_SUCCESS = 'LOAD_CYCLE_VOTING_RESULTS_SUCCESS'
export const LOAD_CYCLE_VOTING_RESULTS_FAILURE = 'LOAD_CYCLE_VOTING_RESULTS_FAILURE'
export const RECEIVED_CYCLE_VOTING_RESULTS = 'RECEIVED_CYCLE_VOTING_RESULTS'

export function receivedCycleVotingResults(cycleId, cycleVotingResults) {
  return {type: RECEIVED_CYCLE_VOTING_RESULTS, cycleId, response: {cycleVotingResults: {[cycleId]: cycleVotingResults}}}
}

export default function loadCycleVotingResults(cycleId) {
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
query($cycleId: ID!) {
  getCycleVotingResults(cycleId: $cycleId) {
    cycleState
    numEligiblePlayers
    numVotes
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
        `,
        variables: {cycleId},
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => ({
          cycleVotingResults: {
            [cycleId]: graphQLResponse.data.getCycleVotingResults,
          },
        }))
    },
    payload: {cycleId},
  }
}
