import {connect} from 'src/db'
import {insertIntoTable} from 'src/server/db/util'

const r = connect()
export const chaptersTable = r.table('chapters')

export function getChapterById(chapterId) {
  return chaptersTable.get(chapterId)
}

export function getChapter(identifier) {
  const identifierLower = String(identifier).toLowerCase()
  return chaptersTable.filter(row => r.or(
    row('id').eq(identifier),
    row('name').downcase().eq(identifierLower)
  ))
  .nth(0)
  .default(null)
}

export function findChapters() {
  return chaptersTable
}

export function saveChapter(chapter, options) {
  return insert(chapter, {...options, conflict: 'update'})
}

function insert(chapter, options) {
  return insertIntoTable(chapter, chaptersTable, options)
}
