import {connect} from 'src/db'
import {insertIntoTable, replaceInTable} from 'src/server/db/util'

const r = connect()
export const votesTable = r.table('votes')

export function findVotesForCycle(cycleId, filters) {
  return r.table('votes')
    .getAll(cycleId, {index: 'cycleId'})
    .filter(filters || {})
}

export function getVoteById(voteId) {
  return votesTable.get(voteId)
}

export function saveVote(vote, options) {
  if (vote.id) {
    return replace(vote, options)
  }

  return insert(vote, options)
}

function replace(vote, options) {
  return replaceInTable(vote, votesTable, options)
}

function insert(vote, options) {
  return insertIntoTable(vote, votesTable, options)
}
