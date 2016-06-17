import micromustache from 'micromustache'

export function renderQuestionBodies(surveyQuestions) {
  return surveyQuestions.map(q => {
    q.body = micromustache.render(q.body, {subject: q.subject.handle})
    return q
  })
}
