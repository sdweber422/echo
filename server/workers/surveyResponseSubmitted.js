import raven from 'raven'

import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {findProjectBySurveyId, getTeamPlayerIds} from '../../server/db/project'
import {getSurveyById, recordSurveyCompletedBy, surveyWasCompletedBy} from '../../server/db/survey'
import {getChapterById} from '../../server/db/chapter'
import sendPlayerStatsSummaries from '../../server/actions/sendPlayerStatsSummaries'
import updateProjectStats from '../../server/actions/updateProjectStats'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export function start() {
  const surveyResponseSubmitted = getQueue('surveyResponseSubmitted')
  surveyResponseSubmitted.process(({data: event}) =>
    processSurveyResponseSubmitted(event)
      .catch(err => {
        console.error(err)
        sentry.captureException(err)
      })
  )
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

  const chapter = await getChapterById(project.chapterId)

  let surveyType
  let cycleId
  let cycleHistoryItem = project.cycleHistory.find(h => h.retrospectiveSurveyId === event.surveyId)
  if (cycleHistoryItem) {
    surveyType = 'retrospective'
    cycleId = cycleHistoryItem.cycleId
  } else {
    cycleHistoryItem = project.cycleHistory.find(h => h.projectReviewSurveyId === event.surveyId)
    if (!cycleHistoryItem) {
      throw new Error('Unable to find the cycle for a given survey while trying to send a survey completion notification. Notification not sent.')
    }
    surveyType = 'projectReview'
    cycleId = cycleHistoryItem.cycleId
  }

  const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)
  const surveyNotPreviouslyCompleted = changes.length > 0

  switch (surveyType) {

    case 'retrospective':
      if (surveyNotPreviouslyCompleted) {
        console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
        const survey = changes[0].new_val
        await Promise.all([
          announce(
            [project.name],
            buildRetroAnnouncement(project, cycleId, survey),
            chatClient
          ),
          updateStatsIfNeeded(project, cycleId, survey, chatClient)
        ])
      } else {
        console.log(`Completed Retrospective Survey [${event.surveyId}] Updated By [${event.respondentId}]`)
        const survey = await getSurveyById(event.surveyId)
        await updateStatsIfNeeded(project, cycleId, survey, chatClient)
      }
      break

    case 'projectReview':
      if (surveyNotPreviouslyCompleted) {
        console.log(`Project Review Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
        const survey = changes[0].new_val
        announce(
          [project.name, chapter.channelName],
          buildProjectReviewAnnouncement(project, cycleId, survey),
          chatClient
        )
      } else {
        console.log(`Completed Project Review Survey [${event.surveyId}] Updated By [${event.respondentId}]`)
      }
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

async function updateStatsIfNeeded(project, cycleId, survey, chatClient) {
  const totalPlayers = getTeamPlayerIds(project, cycleId).length
  const finishedPlayers = survey.completedBy.length

  if (finishedPlayers === totalPlayers) {
    console.log(`All respondents have completed this survey [${survey.id}]. Updating Player Stats`)
    await updateProjectStats(project, cycleId)
    await sendPlayerStatsSummaries(project, cycleId, chatClient)
  }
}

function buildRetroAnnouncement(project, cycleId, survey) {
  const totalPlayers = getTeamPlayerIds(project, cycleId).length
  const finishedPlayers = survey.completedBy.length
  const banner = '🎉  *A member of this team has just submitted their reflections for this retrospective!*'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

function buildProjectReviewAnnouncement(project, cycleId, survey) {
  const finishedPlayers = survey.completedBy.length
  const banner = `🎉  *A project review has just been completed for #${project.name}!*`
  const progress = `This project has been reviewed by ${finishedPlayers} player${finishedPlayers > 1 ? 's' : ''}.`
  return [banner, progress].join('\n')
}

function announce(channels, announcement, chatClient) {
  const announcePromises = channels.map(channel => chatClient.sendChannelMessage(channel, announcement))
  return Promise.all(announcePromises)
}
