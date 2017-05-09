import {Project} from '../models'
import r from '../r'

export default async function getProjectBySurveyId(surveyId) {
  const surveyIdFilter = project => {
    return r.or(
      project('projectReviewSurveyId').default('').eq(surveyId),
      project('retrospectiveSurveyId').default('').eq(surveyId)
    )
  }

  const projects = await Project.filter(surveyIdFilter)
  if (projects.length !== 1) {
    throw new Error('Unable to find a project for survey')
  }

  return projects[0]
}
