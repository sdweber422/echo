import r from '../r'

const responsesTable = r.table('responses')
const projectsTable = r.table('projects')
const surveysTable = r.table('surveys')

export default function findProjectReviewsForPlayer(playerId, projects = projectsTable) {
  const getResponseListForSurvey = surveyInfo => {
    return surveyInfo('questionRefs')
      .concatMap(questionRef => {
        return responsesTable
          .getAll(
            [questionRef('questionId'), playerId, surveyInfo('surveyId')],
            {index: 'questionIdAndRespondentIdAndSurveyId'}
          )
          .map(response => ({
            projectId: surveyInfo('projectId'),
            projectName: surveyInfo('projectName'),
            surveyId: surveyInfo('surveyId'),
            name: questionRef('name'),
            value: response('value'),
          }))
      })
  }
  const reviewIsComplete = review => review.count().eq(1)

  return projects
    .hasFields('projectReviewSurveyId')
    .map(project => ({
      projectId: project('id'),
      projectName: project('name'),
      projectReviewSurvey: surveysTable.get(project('projectReviewSurveyId'))
    }))
    .map(projectWithSurvey => ({
      projectId: projectWithSurvey('projectId'),
      projectName: projectWithSurvey('projectName'),
      surveyId: projectWithSurvey('projectReviewSurvey')('id'),
      questionRefs: projectWithSurvey('projectReviewSurvey')('questionRefs')
    }))
    .map(getResponseListForSurvey)
    .filter(reviewIsComplete)
    .map(reviewResponses =>
      r.object(
        'projectId', reviewResponses.nth(0)('projectId'),
        'projectName', reviewResponses.nth(0)('projectName'),
        reviewResponses.nth(0)('name'), reviewResponses.nth(0)('value'),
      )
    )
}
