import {getFullRetrospectiveSurveyForPlayer} from '../../server/db/survey'
import {graphQLFetcher} from '../../server/util'
import {renderQuestionBodies} from '../../common/models/survey'
import {customQueryError} from '../../server/db/errors'

export function compileSurveyDataForPlayer(playerId) {
  return getFullRetrospectiveSurveyForPlayer(playerId)
    .then(survey => inflateSurveySubjects(survey))
    .then(survey => Object.assign({}, survey, {
      questions: renderQuestionBodies(survey.questions)
    }))
}

export function compileSurveyQuestionDataForPlayer(playerId, questionNumber) {
  return getFullRetrospectiveSurveyForPlayer(playerId)('questions')
    .nth(questionNumber - 1)
    .default(customQueryError(`There is no question number ${questionNumber}`))
    .then(question => inflateSurveyQuestionSubjects([question]))
    .then(questions => questions[0])
}

async function inflateSurveySubjects(survey) {
  try {
    const inflatedQuestions = await inflateSurveyQuestionSubjects(survey.questions)
    return Object.assign({}, survey, {questions: inflatedQuestions})
  } catch (e) {
    throw (e)
  }
}

async function inflateSurveyQuestionSubjects(questions) {
  try {
    const playerIds = getSubjects(questions)
    const playerInfo = await getPlayerInfoByIds(playerIds)

    const inflatedQuestions = questions.map(question => {
      let inflatedSubject
      if (Array.isArray(question.subject)) {
        inflatedSubject = question.subject.map(playerId => playerInfo[playerId])
      } else {
        inflatedSubject = playerInfo[question.subject]
      }
      return Object.assign({}, question, {subject: inflatedSubject})
    })

    return inflatedQuestions
  } catch (e) {
    throw (e)
  }
}

function getSubjects(questions) {
  return questions.reduce((prev, question) => {
    if (Array.isArray(question.subject)) {
      return prev.concat(question.subject)
    }
    return prev.concat([question.subject])
  }, [])
}

function getPlayerInfoByIds(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { id email name handle } }',
    variables: {playerIds},
  })
  .then(json => json.data.getUsersByIds.reduce(
    (prev, player) => {
      return Object.assign({}, prev, {[player.id]: player})
    },
    {}
  ))
}
