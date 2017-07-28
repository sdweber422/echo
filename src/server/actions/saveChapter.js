import getChapter from 'src/server/actions/getChapter'
import {Chapter} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function saveChapter(values = {}) {
  const chapter = {...values}

  let chapterWithSameName
  if (chapter.name) {
    chapter.name = chapter.name.replace(/\s/g, '')
    chapterWithSameName = (await Chapter.filter(row => {
      return row('name').downcase().eq(chapter.name.toLowerCase())
    }))[0]
  }

  if (chapterWithSameName && (!chapter.id || chapter.id !== chapterWithSameName.id)) {
    throw new LGBadRequestError('Chapter name must be unique')
  }

  if (chapter.id) {
    // {conflict: 'update'} option doesn't work when using .save() to update
    // https://github.com/neumino/thinky/issues/454
    if (await getChapter(chapter.id)) {
      return Chapter.get(chapter.id).updateWithTimestamp(chapter)
    }
  }

  return Chapter.save(chapter)
}
