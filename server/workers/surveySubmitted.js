import moment from 'moment-timezone'

import {mapById} from 'src/common/util'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {Project, Survey, getProjectBySurveyId} from 'src/server/services/dataService'
import sendRetroCompletedNotification from 'src/server/actions/sendRetroCompletedNotification'
import {entireProjectTeamHasCompletedSurvey} from 'src/server/util/project'
import {IN_PROGRESS, REVIEW, CLOSED} from 'src/common/models/project'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('surveySubmitted', processSurveySubmitted)
}

export async function processSurveySubmitted(event) {
  const surveyId = (event.survey || {}).id
  const survey = await Survey.get(surveyId)
  if (!survey) {
    throw new Error(`Survey ${surveyId} not found`)
  }

  const project = await getProjectBySurveyId(surveyId)

  switch (survey.id) {
    case project.retrospectiveSurveyId:
      await _changeProjectStateToReviewIfAppropriate(project)
      if (entireProjectTeamHasCompletedSurvey(project, survey)) {
        console.log(`All respondents have completed this survey [${survey.id}].`)
        await sendRetroCompletedNotification(project)
        await _changeProjectStateToClosedIfAppropriate(project, {retrospectiveSurvey: survey})
      }
      await announce(project, buildRetroAnnouncement(project, survey))
      break

    default:
      console.warn('Unrecognized survey type')
  }
}

async function _changeProjectStateToReviewIfAppropriate(project) {
  const now = moment().utc().toDate()
  if (project.state === IN_PROGRESS) {
    await Project.get(project.id)
      .updateWithTimestamp({
        state: REVIEW,
        reviewStartedAt: now,
      })
  }
}

async function _changeProjectStateToClosedIfAppropriate(project, surveys) {
  if (await _projectCanBeClosed(project, surveys)) {
    await Project.get(project.id).updateWithTimestamp({id: project.id, state: CLOSED, closedAt: new Date()})
  }
}

async function _projectCanBeClosed(project, surveys) {
  if (!project.retrospectiveSurveyId) {
    return false
  }

  const {retrospectiveSurvey = await Survey.get(project.retrospectiveSurveyId)} = surveys
  const retrosComplete = project.playerIds.every(id => retrospectiveSurvey.completedBy.includes(id))
  return retrosComplete
}

function buildRetroAnnouncement(project, survey) {
  const totalPlayers = project.playerIds.length
  const finishedPlayers = survey.completedBy.length
  const banner = '🎉  *A member of this team has just submitted their reflections for this retrospective!*'
  const progress = `${finishedPlayers} / ${totalPlayers} retrospectives have been completed for this project.`
  return [banner, progress].join('\n')
}

async function announce(project, announcement) {
  const chatService = require('src/server/services/chatService')
  const projectUsersById = mapById(await getPlayerInfo(project.playerIds))
  const handles = project.playerIds.map(playerId => projectUsersById.get(playerId).handle)

  chatService.sendDirectMessage(handles, announcement)
}
