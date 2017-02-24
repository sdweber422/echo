import Promise from 'bluebird'
import {Question, Stat, Survey, Response} from 'src/server/services/dataService'
import {connect} from 'src/db'

const r = connect()

export async function getStatResponses({surveyId}) {
  const survey = await Survey.get(surveyId)
  const statQuestionRefs = survey.questionRefs.filter(_ => _.statId)

  const statsByQuestionId = await statQuestionRefs.reduce(async (result, next) => ({
    ...(await result),
    [next.questionId]: await Stat.get(next.statId),
  }), Promise.resolve({}))

  const statQuestionRefsIds = r.expr(statQuestionRefs.map(_ => _.questionId))
  const responses = await Response
    .filter({surveyId: survey.id})
    .filter(_ => statQuestionRefsIds.contains(_('questionId')))

  return responses.map(({respondentId, value, questionId, subjectId}) => ({
    statDescriptor: statsByQuestionId[questionId].descriptor,
    respondentId,
    value,
    subjectId,
  }))
}

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
