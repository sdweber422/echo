import raven from 'raven'

import config from 'src/config'
import ChatClient from 'src/server/clients/ChatClient'
import {getQueue} from 'src/server/util'
import {getChapterById} from 'src/server/db/chapter'
import {findProjectBySurveyId} from 'src/server/db/project'
import {getSurveyById, recordSurveyCompletedBy, surveyWasCompletedBy} from 'src/server/db/survey'
import sendPlayerStatsSummaries from 'src/server/actions/sendPlayerStatsSummaries'
import updateProjectStats from 'src/server/actions/updateProjectStats'

const sentry = new raven.Client(config.server.sentryDSN)

const PROJECT_SURVEY_TYPES = {
  RETROSPECTIVE: 'retrospective',
  REVIEW: 'review',
}

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
  if (event.surveyId === project.retrospectiveSurveyId) {
    surveyType = PROJECT_SURVEY_TYPES.RETROSPECTIVE
  } else if (event.surveyId === project.projectReviewSurveyId) {
    surveyType = PROJECT_SURVEY_TYPES.REVIEW
  } else {
    throw new Error(`Invalid survey ID ${event.surveyId}`)
  }

  const {changes} = await recordSurveyCompletedBy(event.surveyId, event.respondentId)
  const surveyChange = changes[0] || null
  if (!surveyChange) {
    throw new Error(`No changes recorded for survey ${event.surveyId} and respondent ${event.respondentId}`)
  }

  const surveyPreviouslyCompletedBy = surveyChange.old_val ? surveyChange.old_val.completedBy : []
  const surveyPreviouslyCompletedByRespondent = surveyPreviouslyCompletedBy.includes(event.respondentId)

  switch (surveyType) {

    case PROJECT_SURVEY_TYPES.RETROSPECTIVE:
      if (surveyChange && surveyPreviouslyCompletedByRespondent) {
        console.log(`Completed Retrospective Survey [${event.surveyId}] Updated By [${event.respondentId}]`)
        const survey = await getSurveyById(event.surveyId)
        await updateStatsIfNeeded(project, survey, chatClient)
      } else {
        console.log(`Retrospective Survey [${event.surveyId}] Completed By [${event.respondentId}]`)
        const survey = surveyChange.new_val
        await Promise.all([
          announce(
            [project.name],
            buildRetroAnnouncement(project, survey),
            chatClient
          ),
          updateStatsIfNeeded(project, survey, chatClient)
        ])
      }
      break

    case PROJECT_SURVEY_TYPES.REVIEW:
      if (surveyChange && surveyPreviouslyCompletedByRespondent) {
        console.log(`Previously completed Project Review Survey [${event.surveyId}] updated by [${event.respondentId}]`)
      } else {
        console.log(`New Project Review Survey [${event.surveyId}] completed by [${event.respondentId}]`)
        const survey = surveyChange.new_val
        announce(
          [project.name, chapter.channelName],
          buildProjectReviewAnnouncement(project, survey),
          chatClient
        )
      }
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

async function updateStatsIfNeeded(project, survey, chatClient) {
  const totalPlayers = project.playerIds.length
  const finishedPlayers = survey.completedBy.length

  if (finishedPlayers === totalPlayers) {
    console.log(`All respondents have completed this survey [${survey.id}]. Updating Player Stats`)
    await updateProjectStats(project)
    await sendPlayerStatsSummaries(project, chatClient)
  }
}

function buildRetroAnnouncement(project, survey) {
  const totalPlayers = project.playerIds.length
  const finishedPlayers = survey.completedBy.length
  const banner = '🎉  *A member of this team has just submitted their reflections for this retrospective!*'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

function buildProjectReviewAnnouncement(project, survey) {
  const finishedPlayers = survey.completedBy.length
  const banner = `🎉  *A project review has just been completed for #${project.name}!*`
  const progress = `This project has been reviewed by ${finishedPlayers} player${finishedPlayers > 1 ? 's' : ''}.`
  return [banner, progress].join('\n')
}

function announce(channels, announcement, chatClient) {
  const announcePromises = channels.map(channel => chatClient.sendChannelMessage(channel, announcement))
  return Promise.all(announcePromises)
}
