import {saveSurvey} from '../../server/db/survey'
import {getProjectsForChapter} from '../../server/db/project'
import {getQuestionsBySubjectType} from '../../server/db/question'

export function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildProjectSurvey(project, cycle.id))
    ))
}

function buildProjectSurvey(project, cycleId) {
  return buildSureveyQuestions(project, cycleId)
    .then(questions => saveSurvey({
      projectId: project.id,
      cycleId,
      questions
    })
  )
}

function buildSureveyQuestions(project, cycleId) {
  const subject = project.cycleTeams[cycleId].playerIds
  return getQuestionsBySubjectType('team')
    .then(teamQuestions => teamQuestions.map(question => ({questionId: question.id, subject})))
}
