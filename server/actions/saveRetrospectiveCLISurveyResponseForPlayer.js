import yup from 'yup'
import {saveResponsesForQuestion} from '../../server/db/response'
import {getRetrospectiveSurveyForPlayer} from '../../server/db/survey'
import {getQuestionById} from '../../server/db/question'
import {graphQLFetcher} from '../../server/util'
import {BadInputError} from '../../server/errors'

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
    const responses = parseResponses(rawResponses, question.responseType)

    await validateResponses(responses, subject, question.responseType)

    return responses
  } catch (e) {
    throw (e)
  }
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

const responseValueParsers = {
  relativeContribution: str => yup.number().cast(str),
  text: str => yup.string().trim().cast(str),
}

const multipartValidators = {
  relativeContribution: responseParts => {
    const values = responseParts.map(({value}) => value)
    const sum = values.reduce((sum, value) => sum + value, 0)
    if (sum !== 100) {
      throw new BadInputError(`Percentages must add up to 100%, got ${sum}`)
    }
  }
}

function parseResponseParams(responseParams, subject, subjectType) {
  const parser = responseParamParsers[subjectType]

  if (!parser) {
    throw new Error(`Missing param parser for subject type: ${subjectType}!`)
  }

  return parser(responseParams, subject)
}

function parseResponses(unparsedValues, responseType) {
  return unparsedValues.map(({subject, value}) => ({
    subject,
    value: parseValue(value, responseType)
  }))
}

function parseValue(value, type) {
  const parser = responseValueParsers[type]

  if (!parser) {
    throw new Error(`Missing response value parser for response type: ${type}!`)
  }

  return parser(value)
}

async function validateResponses(responses, subject, responseType) {
  try {
    await assertValidResponseValues(responses.map(r => r.value), responseType)
    assertCorrectNumberOfResponses(responses, subject)
    if (responses.length > 1) {
      assertValidMultipartResponse(responses, responseType)
    }
  } catch (e) {
    throw (e)
  }
}

const responseValueValidators = {
  relativeContribution: value => yup.number().positive().max(100).validate(value, {strict: true}),
  text: value => yup.string().min(1).max(10000).validate(value, {strict: true}),
}

function assertValidResponseValues(values, type) {
  const validator = responseValueValidators[type]

  if (!validator) {
    return Promise.reject(Error(`Missing validator for response type: ${type}!`))
  }

  return Promise.all(
    values.map(value => validator(value))
  ).catch(e => {
    throw new BadInputError(`Invalid ${type} response. ${e}`)
  })
}

function assertCorrectNumberOfResponses(responses, subject) {
  const subjectPartCount = Array.isArray(subject) ? subject.length : 1
  if (responses.length !== subjectPartCount) {
    throw new BadInputError(`Expected this response to have ${subjectPartCount} parts but found ${responses.length}`)
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

function assertValidMultipartResponse(responseParts, type) {
  if (multipartValidators[type]) {
    multipartValidators[type](responseParts)
  }
}
