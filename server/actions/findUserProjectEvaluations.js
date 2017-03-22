import {Response, Player, Project} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {findValueForReponseQuestionStat} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {LGBadRequestError} from 'src/server/util/error'

const evaluationStatsDescriptors = [
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT,
  STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT,
  STAT_DESCRIPTORS.TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  STAT_DESCRIPTORS.TEAM_PLAY_FRICTION_REDUCTION,
  STAT_DESCRIPTORS.GENERAL_FEEDBACK,
  STAT_DESCRIPTORS.TEAM_PLAY_RECEPTIVENESS,
  STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION,
  STAT_DESCRIPTORS.TEAM_PLAY_RESULTS_FOCUS,
  STAT_DESCRIPTORS.TECHNICAL_HEALTH,
  STAT_DESCRIPTORS.TEAM_PLAY,
]

export default async function findUserProjectEvaluations(userIdentifier, projectIdentifier) {
  const user = await (typeof userIdentifier === 'string' ? Player.get(userIdentifier) : userIdentifier)
  if (!user || !user.id) {
    throw new LGBadRequestError(`User not found for identifier: ${userIdentifier}`)
  }

  const project = await (typeof projectIdentifier === 'string' ? Project.get(projectIdentifier) : projectIdentifier)
  if (!project || !project.id) {
    throw new LGBadRequestError(`Project not found for identifier: ${projectIdentifier}`)
  }

  const {retrospectiveSurveyId} = project
  if (!retrospectiveSurveyId) {
    return []
  }

  const retroSurveyResponses = groupById(
    await Response.filter({
      surveyId: retrospectiveSurveyId,
      subjectId: user.id,
    })
    .getJoin({question: {stat: true}})
  , 'respondentId')

  const userProjectEvaluations = []
  retroSurveyResponses.forEach((responses, respondentId) => {
    // choose create time of earliest response as create time for the evaluation
    const createdAt = responses.sort((r1, r2) => {
      const diff = r1.createdAt.getTime() - r2.createdAt.getTime()
      return diff === 0 ? r1.id.localeCompare(r2.id) : diff
    })[0].createdAt

    const evaluation = {createdAt, submittedById: respondentId}
    evaluationStatsDescriptors.forEach(statsDescriptor => {
      evaluation[statsDescriptor] = findValueForReponseQuestionStat(responses, statsDescriptor)
    })
    userProjectEvaluations.push(evaluation)
  })

  return userProjectEvaluations
}
