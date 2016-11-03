import {connect} from 'src/db'
import {insertIntoTable, replaceInTable} from 'src/server/db/util'

const r = connect()
export const chaptersTable = r.table('chapters')

export function getChapterById(chapterId) {
  return chaptersTable.get(chapterId)
}

export function findChapters() {
  return chaptersTable
}

export function saveChapter(chapter, options) {
  if (chapter.id) {
    return replace(chapter, options)
  }

  return insert(chapter, options)
}

function replace(chapter, options) {
  return replaceInTable(chapter, chaptersTable, options)
}

function insert(chapter, options) {
  return insertIntoTable(chapter, chaptersTable, options)
}
