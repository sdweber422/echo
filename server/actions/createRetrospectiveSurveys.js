import {saveSurvey, getProjectRetroSurvey} from '../../server/db/survey'
import {getProjectsForChapter} from '../../server/db/project'
import {getRetrospectiveSurveyBlueprint} from '../../server/db/surveyBlueprint'

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
  return getRetrospectiveSurveyBlueprint()
    .then(surveyBlueprint => {
      const questionIds = surveyBlueprint.defaultQuestionIds
      if (!questionIds || !questionIds.length) {
        throw new Error('No retrospective questions found!')
      }
      return questionIds.map(questionId => ({questionId, subject}))
    })
}
