import r from '../../db/connect'

export function getProjectsForChapter(chapterId) {
  return r.table('projects').filter({chapterId}).run()
}

