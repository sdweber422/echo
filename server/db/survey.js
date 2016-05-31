import r from '../../db/connect'

export function saveSurvey(survey) {
  if (survey.id) {
    return update(survey.id, survey)
  }
  return insert(survey)
}

function update(id, survey) {
  const surveyWithTimestampts = Object.assign({}, survey, {
    updatedAt: r.now(),
  })
  return r.table('surveys').get(id).update(surveyWithTimestampts).run()
}

function insert(survey) {
  const surveyWithTimestampts = Object.assign({}, survey, {
    updatedAt: r.now(),
    createdAt: r.now(),
  })
  return r.table('surveys').insert(surveyWithTimestampts).run()
}
