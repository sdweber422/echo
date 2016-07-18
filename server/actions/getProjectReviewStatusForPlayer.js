import {getFullSurveyForPlayerById} from '../../server/db/survey'
import {surveyProgress} from '../../common/models/survey'
import {getProjectByName} from '../../server/db/project'

export default async function getProjectReviewStatusForPlayer(projectName, playerId) {
  const project = await getProjectByName(projectName)
  const {projectReviewSurveyId} = project.cycleHistory[project.cycleHistory.length - 1]

  if (!projectReviewSurveyId) {
    throw new Error('No project review survey found for that project')
  }

  const fullSurvey = await getFullSurveyForPlayerById(playerId, projectReviewSurveyId)

  const responses = fullSurvey.questions
    .filter(q => q.response.values.length > 0)
    .map(q => {
      // TODO: remove this assumption that project review questions only have one response
      if (q.response.values.length !== 1) {
        throw new Error('Multi-Subject Project Review Survey Questions Not (Yet) Supported')
      }
      return {
        questionName: q.name,
        values: q.response.values.map(({subjectId, value}) => ({subjectId, value})),
      }
    })

  const {completed} = surveyProgress(fullSurvey)

  return {
    project,
    responses,
    completed,
  }
}
