import raven from 'raven'

import {userCan} from '../../../../common/util'
import {GraphQLError, locatedError} from 'graphql/error'
import {Survey} from './schema'
import {getFullRetrospectiveSurveyForPlayer} from '../../../../server/db/survey'
import {parseQueryError} from '../../../../server/db/errors'
import {graphQLFetcher} from '../../../../server/util'

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
          throw locatedError(err)
        })
    },
  },
}

async function inflateSurveySubjects(survey) {
  const playerIds = getSubjects(survey.questions)
  const playerInfo = await getPlayerInfoByIds(playerIds)

  const inflatedQuestions = survey.questions.map(question => {
    let inflatedSubject
    if (Array.isArray(question.subject)) {
      inflatedSubject = question.subject.map(playerId => playerInfo[playerId])
    } else {
      inflatedSubject = playerInfo[question.subject]
    }
    return Object.assign({}, question, {subject: inflatedSubject})
  })
  return Object.assign({}, survey, {questions: inflatedQuestions})
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
