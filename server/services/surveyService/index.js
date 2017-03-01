import Promise from 'bluebird'
import {Question, Survey, Response} from 'src/server/services/dataService'

export async function getStatResponsesBySubjectId(subjectId) {
  const responses = await Response.filter({subjectId})

  const getStatsDestriptor = async (surveyId, questionId) => {
    const survey = await Survey.get(surveyId)
    const [statQuestionRef] = survey.questionRefs.filter(_ => _.questionId === questionId)
    const {stat: {descriptor}} = await Question.get(statQuestionRef.questionId).getJoin({stat: true})
    return descriptor
  }

  return Promise.map(responses, async ({surveyId, respondentId, value, questionId, subjectId}) => ({
    statDescriptor: await getStatsDestriptor(surveyId, questionId),
    respondentId,
    value,
    subjectId,
  }))
}
