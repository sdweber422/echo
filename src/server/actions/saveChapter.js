import getChapter from 'src/server/actions/getChapter'
import {Chapter} from 'src/server/services/dataService'
import {LGBadRequestError} from 'src/server/util/error'

export default async function saveChapter(chapter) {
  const {id} = chapter || {}
  chapter.name = chapter.name.toLowerCase().replace(/\s/g, '')

  const chaptersWithSameName = await Chapter.filter(row => {
    return row('name').downcase().eq(chapter.name)
  })

  if (chaptersWithSameName.length > 0) {
    throw new LGBadRequestError('Chapter name must be unique')
  }

  if (id) {
    // {conflict: 'update'} option doesn't work when using .save() to update
    // https://github.com/neumino/thinky/issues/454
    if (await getChapter(id)) {
      return Chapter.get(id).updateWithTimestamp(chapter)
    }
  }
  return Chapter.save(chapter)
}
