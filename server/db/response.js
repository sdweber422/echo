import r from '../../db/connect'

export function saveResponsesForQuestion(responses) {
  return insert(responses)
    .then(result => result.generated_keys)
    // TODO:
    // * handle errors!!
    // * check for duplicate responses and throw error or update
    // * validate responses (% sum === 100, etc)
}

function insert(oneOrMoreResponses) {
  const responses = Array.isArray(oneOrMoreResponses) ?
                      oneOrMoreResponses :
                      [oneOrMoreResponses]

  const responsesWithTimestamps = responses.map(response => Object.assign({}, response, {
    updatedAt: r.now(),
    createdAt: r.now(),
  }))
  return r.table('responses').insert(responsesWithTimestamps).run()
}
