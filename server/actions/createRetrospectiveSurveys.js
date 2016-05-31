import {saveSurvey, getProjectRetroSurvey} from '../../server/db/survey'
import {getProjectsForChapter} from '../../server/db/project'
import {getQuestionsBySubjectType} from '../../server/db/question'

export default function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildProjectRetroSurvey(project, cycle.id))
    ))
}

function buildProjectRetroSurvey(project, cycleId) {
  return getProjectRetroSurvey(project.id, cycleId).then(existingSurveys => {
    if (existingSurveys.length) {
      throw (Error(`Project retrospective survey already exists for project ${project.name} cycle ${cycleId}`))
    }

    return buildSureveyQuestions(project, cycleId)
      .then(questions => saveSurvey({
        projectId: project.id,
        cycleId,
        questions
      }))
  })
}

function buildSureveyQuestions(project, cycleId) {
  const subject = project.cycleTeams[cycleId].playerIds
  return getQuestionsBySubjectType('team')
    .then(teamQuestions => {
      if (!teamQuestions.length) {
        throw (Error('No team retrospective questions found!'))
      }
      return teamQuestions.map(question => ({questionId: question.id, subject}))
    })
}
