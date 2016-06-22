import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {getProjectById} from '../../server/db/project'
import {getSurveyById} from '../../server/db/survey'
import r from '../../db/connect'
import {checkForErrors} from '../../server/db/common'

export function start() {
  const retrospectiveSurveyCompleted = getQueue('retrospectiveSurveyCompleted')
  retrospectiveSurveyCompleted.process(({data: event}) => processRetrospectiveSurveyCompleted(event))
}

export async function processRetrospectiveSurveyCompleted(event, chatClient = new ChatClient()) {
  console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
  try {
    const project = await getProjectById(event.projectId)

    const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)

    if (changes.length > 0) {
      const updatedSurvey = changes[0].new_val
      const totalSurveys = project.cycleTeams[event.cycleId].playerIds.length
      const completionCount = updatedSurvey.completedBy.length
      const announcement = buildAnnouncement(completionCount, totalSurveys)
      await chatClient.sendMessage(project.name, announcement)
    }
  } catch (e) {
    console.log(e)
    throw (e)
  }
}

function recordSurveyCompletedBy(surveyId, respondentId) {
  return getSurveyById(surveyId).update({
    completedBy: r.row('completedBy').default([]).setInsert(respondentId)
  }, {returnChanges: true}).then(result => checkForErrors(result))
}

function buildAnnouncement(completedSurveys, totalSurveys) {
  const banner = '🎉  One of your teammates has just submitted their reflections for this retrospective!'
  const progress = `${completedSurveys} / ${totalSurveys} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}
