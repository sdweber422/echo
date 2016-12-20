import {getGraphQLFetcher} from 'src/common/util'

export const FIND_RETRO_SURVEYS_REQUEST = 'FIND_RETRO_SURVEYS_REQUEST'
export const FIND_RETRO_SURVEYS_SUCCESS = 'FIND_RETRO_SURVEYS_SUCCESS'
export const FIND_RETRO_SURVEYS_FAILURE = 'FIND_RETRO_SURVEYS_FAILURE'
export const GET_RETRO_SURVEY_REQUEST = 'GET_RETRO_SURVEY_REQUEST'
export const GET_RETRO_SURVEY_SUCCESS = 'GET_RETRO_SURVEY_SUCCESS'
export const GET_RETRO_SURVEY_FAILURE = 'GET_RETRO_SURVEY_FAILURE'

export const SURVEY_PARSE_FAILURE = 'SURVEY_PARSE_FAILURE'

export const SAVE_SURVEY_RESPONSES_REQUEST = 'SAVE_SURVEY_RESPONSES_REQUEST'
export const SAVE_SURVEY_RESPONSES_SUCCESS = 'SAVE_SURVEY_RESPONSES_SUCCESS'
export const SAVE_SURVEY_RESPONSES_FAILURE = 'SAVE_SURVEY_RESPONSES_FAILURE'

const retroSurveyFields = `
  id,
  project {
    id, name,
    chapter { id name },
    cycle { id cycleNumber }
  },
  questions {
    id body responseType responseInstructions subjectType
    subjects { id name handle profileUrl avatarUrl },
    response { values { subjectId value } }
  }
`

export function getRetrospectiveSurvey(projectName) {
  return function (dispatch, getState) {
    dispatch({type: GET_RETRO_SURVEY_REQUEST})
    const query = {
      variables: {projectName},
      query: `query($projectName:String) { getRetrospectiveSurvey(projectName:$projectName) { ${retroSurveyFields} } }`,
    }

    return getGraphQLFetcher(dispatch, getState().auth)(query)
      .then(graphQLResponse => dispatch({
        type: GET_RETRO_SURVEY_SUCCESS,
        response: graphQLResponse.data.getRetrospectiveSurvey
      }))
      .catch(err => dispatch({
        type: GET_RETRO_SURVEY_FAILURE,
        error: err
      }))
  }
}

export function findRetrospectiveSurveys() {
  return function (dispatch, getState) {
    dispatch({type: FIND_RETRO_SURVEYS_REQUEST})
    const query = {
      query: `query { findRetrospectiveSurveys { ${retroSurveyFields} } }`,
    }

    return getGraphQLFetcher(dispatch, getState().auth)(query)
      .then(graphQLResponse => dispatch({
        type: FIND_RETRO_SURVEYS_SUCCESS,
        response: graphQLResponse.data.findRetrospectiveSurveys
      }))
      .catch(err => dispatch({
        type: FIND_RETRO_SURVEYS_FAILURE,
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
