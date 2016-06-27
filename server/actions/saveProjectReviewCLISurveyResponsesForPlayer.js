import {findActiveProjectReviewSurvey, getProjectByName} from '../../server/db/project'
import saveSurveyResponse from './saveSurveyResponse'

export default async function saveProjectReviewCLISurveyResponsesForPlayer(respondentId, projectName, rawResponses) {
  const project = await getProjectByName(projectName)
  const survey = await findActiveProjectReviewSurvey(project)

  const createdIdLists = await Promise.all(
    Object.keys(rawResponses).map(async questionName => {
      const {questionId, subject} = survey.questionRefs.find(ref => ref.name === questionName)

      return await saveSurveyResponse({
        respondentId,
        responseParams: [rawResponses[questionName]],
        surveyId: survey.id,
        questionId,
        subject,
      })
    })
  )

  return createdIdLists.reduce((a, b) => a.concat(b), [])
}
