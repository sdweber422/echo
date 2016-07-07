import raven from 'raven'

import {GraphQLInt, GraphQLString, GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from '../../../../common/util'
import {parseQueryError} from '../../../../server/db/errors'
import {getProjectByName} from '../../../../server/db/project'
import {compileSurveyDataForPlayer, compileSurveyQuestionDataForPlayer} from '../../../../server/actions/compileSurveyData'
import getProjectReviewStatusForPlayer from '../../../../server/actions/getProjectReviewStatusForPlayer'

import {Survey, SurveyQuestion, ProjectReviewSurveyStatus} from './schema'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default {
  getProjectReviewSurveyStatus: {
    type: ProjectReviewSurveyStatus,
    args: {
      projectName: {type: new GraphQLNonNull(GraphQLString)}
    },
    resolve(source, {projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getProjectReviewSurveyStatus')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      return getProjectReviewStatusForPlayer(projectName, currentUser.id)
        .catch(err => {
          err = parseQueryError(err)
          sentry.captureException(err)
          throw err
        })
    },
  },
  getRetrospectiveSurvey: {
    type: Survey,
    args: {
      projectName: {
        type: GraphQLString,
        description: 'The name of the project whose retrospective survey should be returned. Required if the current user is in more than one project this cycle.'
      }
    },
    resolve(source, {projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const projectId = projectName ? getProjectByName(projectName)('id') : undefined

      return compileSurveyDataForPlayer(currentUser.id, projectId)
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
      },
      projectName: {
        type: GraphQLString,
        description: 'The name of the project whose retrospective survey question should be returned. Required if the current user is in more than one project this cycle.'
      }
    },
    resolve(source, {questionNumber, projectName}, {rootValue: {currentUser}}) {
      if (!currentUser || !userCan(currentUser, 'getRetrospectiveSurvey')) {
        throw new GraphQLError('You are not authorized to do that.')
      }

      const projectId = projectName ? getProjectByName(projectName)('id') : undefined

      return compileSurveyQuestionDataForPlayer(currentUser.id, questionNumber, projectId)
        .catch(err => {
          err = parseQueryError(err)
          sentry.captureException(err)
          throw err
        })
    },
  }
}

