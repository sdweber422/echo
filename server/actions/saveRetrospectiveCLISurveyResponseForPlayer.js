import yup from 'yup'
import {saveResponsesForQuestion} from '../../server/db/response'
import {getRetrospectiveSurveyForPlayer} from '../../server/db/survey'
import {getQuestionById} from '../../server/db/question'
import {graphQLFetcher} from '../../server/util'

export default async function saveRetrospectiveCLISurveyResponseForPlayer(respondentId, {questionNumber, responseParams}) {
  try {
    const questionIndex = questionNumber - 1
    const survey = await getRetrospectiveSurveyForPlayer(respondentId)
    const {questionId, subject} = survey.questionRefs[questionIndex]
    const question = await getQuestionById(questionId)

    const defaultResponseAttrs = {
      questionId,
      respondentId,
      surveyId: survey.id,
    }

    const responses = await parseAndValidateResponseParams(responseParams, question, subject)
      .then(responses => responses.map(response => Object.assign({}, defaultResponseAttrs, response)))

    const createdIds = await saveResponsesForQuestion(responses)

    return createdIds
  } catch (e) {
    throw (e)
  }
}

async function parseAndValidateResponseParams(responseParams, question, subject) {
  try {
    const rawResponses = await parseResponseParams(responseParams, subject, question.subjectType)
    const responses = await validateResponses(rawResponses, question.responseType)
    if (responses.length > 1) {
      assertValidMultipartResponse(responses, question.responseType)
    }
    return responses
  } catch (e) {
    throw (e)
  }
}

function getPlayerIdsForHandles(handles) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($handles: [String]!) { getUsersByHandles(handles: $handles) { id handle } }',
    variables: {handles},
  })
  .then(json => json.data.getUsersByHandles.reduce(
    (prev, u) => Object.assign(prev, {[u.handle]: u.id}),
    {}
  ))
}

const responseParamParsers = {
  team: async responseParams => {
    const valuesByHandle = responseParams.reduce((prev, param) => {
      const [handle, value] = param.split(':')
      return Object.assign(prev, {[handle]: value})
    }, {})

    const handles = Object.keys(valuesByHandle)

    try {
      const idsByHandle = await getPlayerIdsForHandles(handles)
      return handles.map(handle => ({
        subject: idsByHandle[handle],
        value: valuesByHandle[handle],
      }))
    } catch (e) {
      throw (e)
    }
  },
  player: async (responseParams, subject) => {
    return [{subject, value: responseParams[0]}]
  },
}

function parseResponseParams(responseParams, subject, subjectType) {
  const parser = responseParamParsers[subjectType]

  if (!parser) {
    throw Error(`Unknown subjectType: ${subjectType}!`)
  }

  return parser(responseParams, subject)
}

function validateResponses(unparsedValues, responseType) {
  return Promise.all(
    unparsedValues.map(({subject, value}) =>
      parseValue(value, responseType)
        .then(parsedValue => ({subject, value: parsedValue}))
    )
  )
}

const multipartValidators = {
  percentage: responseParts => {
    const values = responseParts.map(({value}) => value)
    const sum = values.reduce((sum, value) => sum + value, 0)
    if (sum !== 100) {
      throw (Error(`Percentages must add up to 100%, got ${sum}`))
    }
  }
}

function assertValidMultipartResponse(responseParts, type) {
  if (multipartValidators[type]) {
    multipartValidators[type](responseParts)
  }
}

const valueParsers = {
  percentage: value => yup.number().positive().max(100).validate(value),
  text: value => yup.string().trim().min(1).max(10000).validate(value),
}

function parseValue(value, type) {
  const parser = valueParsers[type]

  if (!parser) {
    return Promise.reject(Error(`Unknown response type: ${type}!`))
  }

  return parser(value)
}
