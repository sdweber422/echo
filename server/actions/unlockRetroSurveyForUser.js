import {Project, Survey} from 'src/server/services/dataService'


export async function unlockRetroSurveyForUser({playerId, projectId}) {
  const project = await Project.get(projectId)
  const survey = await project.surveyModel()

  survey.removeRelation(createdAt[projectId])
  await survey.save()
}
