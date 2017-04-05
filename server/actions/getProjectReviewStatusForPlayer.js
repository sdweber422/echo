import {surveyProgress} from 'src/common/models/survey'
import {Project, getFullSurveyForPlayerById} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function getProjectReviewStatusForPlayer(projectName, playerId) {
  const project = (await Project.filter({name: projectName}))[0]
  if (!project) {
    throw new LGBadRequestError(`Project ${projectName} not found`)
  }

  const {projectReviewSurveyId} = project
  if (!projectReviewSurveyId) {
    throw new LGBadRequestError('No project review survey found for that project')
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
