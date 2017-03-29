import Promise from 'bluebird'
import {Question, Response} from 'src/server/services/dataService'

export async function getStatResponsesBySubjectId(subjectId) {
  const responses = await Response.filter({subjectId})

  const getStatDestriptor = memoizedStatDescriptorFetcher()

  return await Promise.mapSeries(responses, async ({respondentId, value, questionId, subjectId}) => ({
    statDescriptor: await getStatDestriptor(questionId),
    respondentId,
    value,
    subjectId,
  })).then(statResponses =>
    statResponses.filter(response => response.statDescriptor !== null)
  )
}

function memoizedStatDescriptorFetcher() {
  const cache = new Map()
  return async questionId => {
    if (!cache.has(questionId)) {
      const {stat} = await Question.get(questionId).getJoin({stat: true})
      cache.set(questionId, stat ? stat.descriptor : null)
    }
    return cache.get(questionId)
  }
}
