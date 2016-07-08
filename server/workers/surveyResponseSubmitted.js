import r from '../../db/connect'
import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {findProjectBySurveyId, getTeamPlayerIds} from '../../server/db/project'
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
    project = await findProjectBySurveyId(event.surveyId)
  } catch (err) {
    return
  }

  const chapter = await r.table('chapters').get(project.chapterId)

  let surveyType
  let cycleId
  const cycleHistoryItem = project.cycleHistory.find(h => h.retrospectiveSurveyId === event.surveyId)
  if (cycleHistoryItem) {
    surveyType = 'retrospective'
    cycleId = cycleHistoryItem.cycleId
  } else {
    surveyType = 'projectReview'
    cycleId = project.cycleHistory.find(h => h.projectReviewSurveyId === event.surveyId).cycleId
  }

  const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)

  if (changes.length > 0) {
    console.log(`Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
    const announceSurveyComplete = {
      retrospective: () => announce(
        [project.name],
        buildRetroAnnouncement(project, cycleId, changes[0].new_val),
        chatClient
      ),
      projectReview: () => announce(
        [project.name, chapter.channelName],
        buildProjectReviewAnnouncement(project, cycleId, changes[0].new_val),
        chatClient
      ),
    }[surveyType]

    if (announceSurveyComplete) {
      await announceSurveyComplete()
    }
  }
}

function buildRetroAnnouncement(project, cycleId, survey) {
  const totalPlayers = getTeamPlayerIds(project, cycleId).length
  const finishedPlayers = survey.completedBy.length
  const banner = '🎉  *One of your teammates has just submitted their reflections for this retrospective!*'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

function buildProjectReviewAnnouncement(project, cycleId, survey) {
  const finishedPlayers = survey.completedBy.length
  const banner = `🎉  *A project review has just been completed for #${project.name}!*`
  const progress = `This project has been reviewed by ${finishedPlayers} player(s).`
  return [banner, progress].join('\n')
}

function announce(channels, announcement, chatClient) {
  const announcePromises = channels.map(channel => chatClient.sendMessage(channel, announcement))
  return Promise.all(announcePromises)
}
