import r from '../../db/connect'

export function getModeratorById(id, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const moderator = r.table('moderators').get(id)
  return options.mergeChapter ?
    moderator
      .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
      .without('chapterId') :
    moderator
}
