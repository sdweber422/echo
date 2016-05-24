import r from '../../db/connect'
// const util = require('util');

export function reassignPlayersToChapter(playerIds, chapterId) {
  const now = r.now()
  const chapterHistoryItem = {
    chapterId,
    until: now,
  }
  // find all of the players for the given IDs, but only update the ones
  // who aren't already in the given chapter
  return r.table('players')
    .getAll(...playerIds)
    .filter(r.row('chapterId').ne(chapterId))
    .update({
      chapterId,
      chapterHistory: r.row('chapterHistory').default([]).insertAt(0, chapterHistoryItem),
      updatedAt: now,
    }, {returnChanges: 'always'})
    .run()
    .then(updatedPlayers => {
      if (updatedPlayers.errors) {
        return Promise.reject(updatedPlayers.first_error)
      }
      if (updatedPlayers.replaced > 0) {
        return updatedPlayers.changes.map(change => change.new_val)
      }
      return []
    })
}

