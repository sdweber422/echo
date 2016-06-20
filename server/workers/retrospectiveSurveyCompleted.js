import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {getProjectById} from '../../server/db/project'
import {getSurveyCompletionCount} from '../../server/db/survey'

export function start() {
  const retrospectiveSurveyCompleted = getQueue('retrospectiveSurveyCompleted')
  retrospectiveSurveyCompleted.process(({data: event}) => processRetrospectiveSurveyCompleted(event))
}

async function processRetrospectiveSurveyCompleted(event) {
  console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
  try {
    const project = await getProjectById(event.projectId)

    const completedSurveys = await getSurveyCompletionCount(event.surveyId)
    const totalSurveys = project.cycleTeams[event.cycleId].playerIds.length
    const announcement = buildAnnouncement(completedSurveys, totalSurveys)

    const client = new ChatClient()
    await client.sendMessage(project.name, announcement)
  } catch (e) {
    console.log(e)
    throw (e)
  }
}

function buildAnnouncement(completedSurveys, totalSurveys) {
  const banner = '🎉  One of your teammates has just submitted their reflections for this retrospective!'
  const progress = `${completedSurveys} / ${totalSurveys} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}
