import r from '../../db/connect'

export function getModeratorById(id, mergeChapter = false) {
  const moderator = r.table('moderators').get(id)
  return mergeChapter ?
    moderator
      .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
      .without('chapterId') :
    moderator
}
