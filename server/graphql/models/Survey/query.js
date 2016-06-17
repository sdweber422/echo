import raven from 'raven'

import {GraphQLInt, GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import {getFullRetrospectiveSurveyForPlayer} from '../../../../server/db/survey'
import {parseQueryError, customQueryError} from '../../../../server/db/errors'
import {graphQLFetcher} from '../../../../server/util'

import {Survey, SurveyQuestion} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getRetrospectiveSurvey: {
    type: Survey,
    args: {},
    resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return getFullRetrospectiveSurveyForPlayer(currentUser.id)
        .then(survey => inflateSurveySubjects(survey))
        .catch(err => {
          err = parseQueryError(err)
          sentry.captureException(err)
          throw err
        })
    },
  },
  getRetrospectiveSurveyQuestion: {
    type: SurveyQuestion,
    args: {
      questionNumber: {
        type: new GraphQLNonNull(GraphQLInt)
      }
    },
    resolve(source, args, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return getFullRetrospectiveSurveyForPlayer(currentUser.id)('questions')
        .nth(args.questionNumber - 1)
        .default(customQueryError(`There is no question number ${args.questionNumber}`))
        .then(question => inflateSurveyQuestionSubjects([question]))
        .then(questions => questions[0])
        .catch(err => {
          err = parseQueryError(err)
          sentry.captureException(err)
          throw err
        })
    },
  }
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
