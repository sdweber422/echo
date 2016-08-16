import {getGraphQLFetcher} from 'src/common/util'

export const LOAD_RETRO_SURVEY_REQUEST = 'LOAD_RETRO_SURVEY_REQUEST'
export const LOAD_RETRO_SURVEY_SUCCESS = 'LOAD_RETRO_SURVEY_SUCCESS'
export const LOAD_RETRO_SURVEY_FAILURE = 'LOAD_RETRO_SURVEY_FAILURE'

export const SURVEY_PARSE_FAILURE = 'SURVEY_PARSE_FAILURE'

export const SAVE_SURVEY_RESPONSES_REQUEST = 'SAVE_SURVEY_RESPONSES_REQUEST'
export const SAVE_SURVEY_RESPONSES_SUCCESS = 'SAVE_SURVEY_RESPONSES_SUCCESS'
export const SAVE_SURVEY_RESPONSES_FAILURE = 'SAVE_SURVEY_RESPONSES_FAILURE'

export function fetchRetroSurvey(filters) {
  return function (dispatch, getState) {
    dispatch({type: LOAD_RETRO_SURVEY_REQUEST})

    const {auth} = getState()

    const query = {
      variables: filters,

      query: `
query($projectName:String) {
  getRetrospectiveSurvey(projectName:$projectName) {
    id,
    project {
      id,
      name,
    },
    cycle {
      id,
      cycleNumber,
    },
    questions {
      id,
      body,
      responseType,
      responseInstructions,
      subjectType,
      subjects {
        id,
        name,
        handle,
        profileUrl,
        avatarUrl,
      },
      response {
        values {
          subjectId,
          value,
        }
      },
    },
  },
}`,
    }

    return getGraphQLFetcher(dispatch, auth)(query)
      .then(graphQLResponse => dispatch({
        type: LOAD_RETRO_SURVEY_SUCCESS,
        response: graphQLResponse.data.getRetrospectiveSurvey
      }))
      .catch(err => dispatch({
        type: LOAD_RETRO_SURVEY_FAILURE,
        error: err
      }))
  }
}

export function saveRetroSurveyResponses(responses, {groupIndex}) {
  return function (dispatch, getState) {
    dispatch({type: SAVE_SURVEY_RESPONSES_REQUEST, groupIndex})

    const {auth} = getState()

    const query = {
      variables: {responses},

      query: `
mutation($responses:[SurveyResponseInput]!) {
  saveRetrospectiveSurveyResponses(responses:$responses) {
    createdIds
  }
}`,
    }

    return getGraphQLFetcher(dispatch, auth)(query)
      .then(graphQLResponse => dispatch({
        type: SAVE_SURVEY_RESPONSES_SUCCESS,
        response: graphQLResponse.data.saveRetrospectiveSurveyResponse,
      }))
      .catch(err => dispatch({
        type: SAVE_SURVEY_RESPONSES_FAILURE,
        error: err
      }))
  }
}

export function surveyParseFailure(error) {
  return function (dispatch) {
    dispatch({
      type: SURVEY_PARSE_FAILURE,
      error,
    })
  }
}
