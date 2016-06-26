/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'
import {surveysTable, mergeSurveyStats} from '../../server/db/survey'
import {responsesTable} from '../../server/db/response'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export default function retrospectiveSurveyCompleted(queue) {
  completedSurveysChangeFeed().then(cursor => {
    cursor.each((err, surveyCompletionInfo) => {
      if (err) {
        console.error(err)
        sentry.captureException(err)
        return
      }
      console.log(`Retrospective Survey [${surveyCompletionInfo.surveyId}] Completed By [${surveyCompletionInfo.respondentId}]`)
      queue.add(surveyCompletionInfo)
    })
  })
}

function completedSurveysChangeFeed() {
  let query = newResponses().pluck('respondentId', 'surveyId')

  query = joinSurvey(query)
  query = mergeSurveyStats(query)
  query = matchOnlyIfSurveyCompletedByRespondant(query)

  return query
}

function newResponses() {
  return responsesTable.changes()
    .filter(r.row('old_val').eq(null))
    .map(changes => changes('new_val'))
}

function joinSurvey(query) {
  return query
    .eqJoin('surveyId', surveysTable)
    .map(row => ({
      left: row('left'),
      right: row('right').pluck('questionRefs')
    }))
    .zip()
}

function matchOnlyIfSurveyCompletedByRespondant(query) {
  return query.filter(row =>
    row('progress').filter(progressItem =>
      row('respondentId').eq(progressItem('respondentId'))
    )('completed').nth(0).default(false)
  )
}
