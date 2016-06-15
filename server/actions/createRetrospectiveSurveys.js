import {saveSurvey, getProjectRetroSurvey} from '../../server/db/survey'
import {getProjectsForChapter} from '../../server/db/project'
import {getQuestionsBySubjectType} from '../../server/db/question'

export default function createRetrospectiveSurveys(cycle) {
  return getProjectsForChapter(cycle.chapterId)
    .then(projects => Promise.all(
      projects.map(project => buildProjectRetroSurvey(project, cycle.id))
    ))
}

async function buildProjectRetroSurvey(project, cycleId) {
  try {
    await getProjectRetroSurvey(project.id, cycleId)
  } catch (err) {
    return await buildSurveyQuestionRefs(project, cycleId)
      .then(questionRefs => saveSurvey({
        projectId: project.id,
        cycleId,
        questionRefs
      }))
  }

  throw new Error(`Project retrospective survey already exists for project ${project.name} cycle ${cycleId}.`)
}

function buildSurveyQuestionRefs(project, cycleId) {
  const subject = project.cycleTeams[cycleId].playerIds
  return getQuestionsBySubjectType('team')
    .then(teamQuestions => {
      if (!teamQuestions.length) {
        throw new Error('No team retrospective questions found!')
      }
      return teamQuestions.map(question => ({questionId: question.id, subject}))
    })
}
