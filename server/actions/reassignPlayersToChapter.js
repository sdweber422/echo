import {Player, r} from 'src/server/services/dataService'

export default function reassignPlayersToChapter(playerIds, chapterId) {
  const now = r.now()
  return Player
    .getAll(...playerIds)
    .filter(r.row('chapterId').ne(chapterId))
    .update({
      chapterId,
      chapterHistory: r.row('chapterHistory')
        .default([])
        .insertAt(0, {
          chapterId: r.row('chapterId'),
          until: now,
        }),
      updatedAt: now,
    })
}
