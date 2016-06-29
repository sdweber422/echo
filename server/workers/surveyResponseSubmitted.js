import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {findProjectByRetrospectiveSurveyId, getTeamPlayerIds} from '../../server/db/project'
import {recordSurveyCompletedBy, surveyWasCompletedBy} from '../../server/db/survey'

export function start() {
  const surveyResponseSubmitted = getQueue('surveyResponseSubmitted')
  surveyResponseSubmitted.process(({data: event}) => processSurveyResponseSubmitted(event))
}

export async function processSurveyResponseSubmitted(event, chatClient = new ChatClient()) {
  if (!await surveyWasCompletedBy(event.surveyId, event.respondentId)) {
    return
  }

  let project
  try {
    project = await findProjectByRetrospectiveSurveyId(event.surveyId)
  } catch (err) {
    return
  }

  const cycleId = project.cycleHistory.filter(h => h.retrospectiveSurveyId === event.surveyId)[0].cycleId

  const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)

  if (changes.length > 0) {
    console.log(`Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
    const updatedSurvey = changes[0].new_val
    const totalPlayers = getTeamPlayerIds(project, cycleId).length
    const finishedPlayers = updatedSurvey.completedBy.length
    const announcement = buildAnnouncement(finishedPlayers, totalPlayers)
    await chatClient.sendMessage(project.name, announcement)
  }
}

function buildAnnouncement(finishedPlayers, totalPlayers) {
  const banner = '🎉  One of your teammates has just submitted their reflections for this retrospective!'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}
