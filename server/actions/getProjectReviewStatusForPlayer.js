import {getSurveyById, inflateQuestionRefs, mergeSurveyStats} from '../../server/db/survey'
import {getProjectByName} from '../../server/db/project'
import {customQueryError} from '../../server/db/errors'

export default async function getProjectReviewStatusForPlayer(projectName, playerId) {
  const project = await getProjectByName(projectName)
  const {projectReviewSurveyId} = project.cycleHistory[project.cycleHistory.length - 1]

  const fullSurvey = await getSurveyWithStatsAndInflatedRefsForPlayer(projectReviewSurveyId, playerId)

  const progress = fullSurvey.progress.find(({respondentId}) => respondentId === playerId)
  const responses = fullSurvey.questions
    .filter(q => Boolean(q.response))
    .map(q => ({questionName: q.name, response: q.response}))

  return {
    completed: Boolean(progress && progress.completed),
    project,
    responses,
  }
}

async function getSurveyWithStatsAndInflatedRefsForPlayer(surveyId, playerId) {
  const surveyQuery = getSurveyById(surveyId)
    .default(customQueryError('No project review survey found for that project'))
  return await mergeSurveyStats(inflateQuestionRefs(playerId, surveyQuery))
}
