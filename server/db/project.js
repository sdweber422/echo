import r from '../../db/connect'

export function getProjectsForChapter(chapterId) {
  return r.table('projects').getAll(chapterId, {index: 'chapterId'}).run()
}

