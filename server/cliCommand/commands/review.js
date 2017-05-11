import {IN_PROGRESS, REVIEW, CLOSED_FOR_REVIEW, CLOSED} from 'src/common/models/project'
import {surveyProgress} from 'src/common/models/survey'
import {userCan} from 'src/common/util'

import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import handleCompleteSurvey from 'src/server/actions/handleCompleteSurvey'
import handleSubmitSurveyResponses from 'src/server/actions/handleSubmitSurveyResponses'
import {Survey, Project, getFullSurveyForPlayerById} from 'src/server/services/dataService'
import {LGCLIUsageError, LGBadRequestError, LGNotAuthorizedError} from 'src/server/util/error'

export async function _saveReview(user, projectName, namedResponses) {
  if (!user || !userCan(user, 'saveResponse')) {
    throw new LGNotAuthorizedError()
  }

  const project = (await Project.filter({name: projectName}))[0]
  if (!project) {
    throw new LGBadRequestError(`Project ${projectName} not found`)
  }

  _assertIsExternalReview(user, project)
  _assertProjectIsInReviewState(project, [REVIEW])
  await _assertProjectHasLeadCoach(project)
  await _assertProjectArtifactIsSet(project)

  const responses = await _buildResponsesFromNamedResponses(namedResponses, project, user.id)
  await _assertCurrentUserCanSubmitResponsesForRespondent(user, responses)

  const savedResponseIds = await handleSubmitSurveyResponses(responses)
  const projectReviewSurveyId = responses[0].surveyId

  // unlike with the retro survey, project review responses submitted via the CLI
  // are checked to automatically trigger survey completion handling
  const fullSurvey = await getFullSurveyForPlayerById(user.id, projectReviewSurveyId)
  if (surveyProgress(fullSurvey).completed) {
    await handleCompleteSurvey(projectReviewSurveyId, user.id)
  }

  return savedResponseIds
}

async function _buildResponsesFromNamedResponses(namedResponses, project, respondentId) {
  const survey = await Survey.get(project.projectReviewSurveyId)

  return namedResponses.map(namedResponse => {
    const {questionName, responseParams} = namedResponse
    const {questionId, subjectIds} = survey.questionRefs.find(ref => ref.name === questionName) || {}
    return {
      respondentId,
      questionId,
      surveyId: survey.id,
      values: [{subjectId: subjectIds[0], value: responseParams[0]}]
    }
  })
}

function _assertCurrentUserCanSubmitResponsesForRespondent(currentUser, responses) {
  responses.forEach(response => {
    if (currentUser.id !== response.respondentId) {
      throw new LGBadRequestError('You cannot submit responses for other players.')
    }
  })
}

async function _assertProjectHasLeadCoach(project) {
  if (!project.coachId) {
    const chatService = require('src/server/services/chatService')
    const projectPlayerHandles = (await getPlayerInfo(project.playerIds)).map(player => player.handle)

    chatService.sendDirectMessage(projectPlayerHandles, `A review has been blocked for project ${project.name}. Please ask the coaching coordinator to assign a lead coach.`)
    throw new LGBadRequestError(`Reviews cannot be accepted for project ${project.name} because a lead coach has not been assigned. The project members have been notified`)
  }
}

function _assertIsExternalReview(currentUser, project) {
  if (project.playerIds.includes(currentUser.id)) {
    throw new LGBadRequestError(`Whoops! You are on team #${project.name}. To review your own project, use the /retro command.`)
  }
}

async function _assertProjectArtifactIsSet(project) {
  const chatService = require('src/server/services/chatService')
  const projectPlayerHandles = (await getPlayerInfo(project.playerIds)).map(player => player.handle)

  if (!project.artifactURL) {
    chatService.sendDirectMessage(projectPlayerHandles, `A review has been blocked for project ${project.name}. Please set your artifact.`)
    throw new LGBadRequestError(`Reviews cannot be processed for project ${project.name} because an artifact has not been set. The project members have been notified.`)
  }
}

function _assertProjectIsInReviewState(project) {
  if (project.state === REVIEW) {
    return
  }

  if (project.state === IN_PROGRESS) {
    throw new LGBadRequestError(`The ${project.name} project is still in progress and can not be reviewed yet.`)
  }

  if (
    project.state === CLOSED ||
    project.state === CLOSED_FOR_REVIEW
  ) {
    throw new LGBadRequestError(`The ${project.name} project is closed and can no longer be reviewed.`)
  }

  throw new LGBadRequestError(`The ${project.name} project is in the ${project.state} state and cannot be reviewed.`)
}

export async function invoke(args, {user}) {
  if (args._.length < 2) {
    throw new LGCLIUsageError()
  }

  const [projectNameOrChannel, score] = args._
  const projectName = projectNameOrChannel.replace(/^#/, '')
  const responses = [{questionName: 'completeness', responseParams: [score]}]
  await _saveReview(user, projectName, responses)

  return {
    text: `Completeness score captured for ${projectName}. Review is complete. Thanks for your input.`
  }
}
