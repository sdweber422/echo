import Promise from 'bluebird'

export async function up(r) {
  const projects = await r.table('projects').pluck('id', 'projectReviewSurveyId')

  await Promise.map(projects, project => {
    if (project.projectReviewSurveyId) {
      return Promise.all([
        r.table('responses')
          .filter({surveyId: project.projectReviewSurveyId})
          .delete(),

        r.table('surveys')
          .get(project.projectReviewSurveyId)
          .delete(),
      ])
    }
  }, {concurrency: 50})

  await r.table('projects').replace(project => (
    project.without('projectReviewSurveyId')
  ))
}

export function down() {
  // irreversible migration
}
