import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {getProjectById, getTeamPlayerIds} from '../../server/db/project'
import {update as updateSurvey} from '../../server/db/survey'
import r from '../../db/connect'

export function start() {
  const retrospectiveSurveyCompleted = getQueue('retrospectiveSurveyCompleted')
  retrospectiveSurveyCompleted.process(({data: event}) => processRetrospectiveSurveyCompleted(event))
}

export async function processRetrospectiveSurveyCompleted(event, chatClient = new ChatClient()) {
  try {
    const project = await getProjectById(event.projectId)

    const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)

    if (changes.length > 0) {
      console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
      const updatedSurvey = changes[0].new_val
      const totalPlayers = getTeamPlayerIds(project, event.cycleId).length
      const finishedPlayers = updatedSurvey.completedBy.length
      const announcement = buildAnnouncement(finishedPlayers, totalPlayers)
      await chatClient.sendMessage(project.name, announcement)
    }
  } catch (e) {
    console.log(e)
    throw (e)
  }
}

function recordSurveyCompletedBy(surveyId, respondentId) {
  const currentCompletedBy = r.row('completedBy').default([])
  const newCompletedBy = currentCompletedBy.setInsert(respondentId)
  const newUpdatedAt = r.branch(
    newCompletedBy.eq(currentCompletedBy),
    r.row('updatedAt'),
    r.now()
  )
  return updateSurvey({
    id: surveyId,
    completedBy: newCompletedBy,
    updatedAt: newUpdatedAt
  }, {returnChanges: true})
}

function buildAnnouncement(finishedPlayers, totalPlayers) {
  const banner = '🎉  One of your teammates has just submitted their reflections for this retrospective!'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}
