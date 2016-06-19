import raven from 'raven'

import {GraphQLInt, GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import {parseQueryError} from '../../../../server/db/errors'
import {compileSurveyDataForPlayer, compileSurveyQuestionDataForPlayer} from '../../../../server/actions/compileSurveyData'

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

      return compileSurveyDataForPlayer(currentUser.id)
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

      return compileSurveyQuestionDataForPlayer(currentUser.id, args.questionNumber)
        .catch(err => {
          err = parseQueryError(err)
          sentry.captureException(err)
          throw err
        })
    },
  }
}

