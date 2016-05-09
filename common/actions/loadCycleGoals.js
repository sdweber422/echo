import {getGraphQLFetcher} from '../util'

export const LOAD_CYCLE_GOALS_REQUEST = 'LOAD_CYCLE_GOALS_REQUEST'
export const LOAD_CYCLE_GOALS_SUCCESS = 'LOAD_CYCLE_GOALS_SUCCESS'
export const LOAD_CYCLE_GOALS_FAILURE = 'LOAD_CYCLE_GOALS_FAILURE'
export const RECEIVED_CYCLE_GOALS = 'RECEIVED_CYCLE_GOALS'

export function receivedCycleGoals(cycleId, cycleGoals) {
  return {type: RECEIVED_CYCLE_GOALS, cycleId, response: {cycleGoals: {[cycleId]: cycleGoals}}}
}

export default function loadCycleGoals(cycleId) {
  return {
    types: [
      LOAD_CYCLE_GOALS_REQUEST,
      LOAD_CYCLE_GOALS_SUCCESS,
      LOAD_CYCLE_GOALS_FAILURE,
    ],
    shouldCallAPI: () => true,
    callAPI: (dispatch, getState) => {
      const query = {
        query: `
query($cycleId: ID!) {
  getCycleGoals(cycleId: $cycleId) {
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
        `,
        variables: {cycleId},
      }
      const {auth} = getState()

      return getGraphQLFetcher(dispatch, auth)(query)
        .then(graphQLResponse => ({
          cycleGoals: {
            [cycleId]: graphQLResponse.data.getCycleGoals,
          },
        }))
    },
    payload: {cycleId},
  }
}
