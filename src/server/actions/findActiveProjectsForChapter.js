import {REFLECTION, PRACTICE} from 'src/common/models/cycle'
import {r, getLatestCycleForChapter} from 'src/server/services/dataService'
import {LGInternalServerError} from 'src/server/util/error'

export default async function findActiveProjectsForChapter(chapterId, options = {}) {
  const latestCycle = await getLatestCycleForChapter(chapterId, {default: null})
  if (!latestCycle) {
    throw new LGInternalServerError(`Cycle not found for chapter ${chapterId}`)
  }

  let projectFilter = {chapterId, cycleId: latestCycle.id}
  if (options.filter) {
    projectFilter = {...projectFilter, ...options.filter}
  }

  const activeProjects = latestCycle && (latestCycle.state === PRACTICE || latestCycle.state === REFLECTION) ?
    r.table('projects').filter(projectFilter) : null

  if (options.count) {
    return activeProjects ? activeProjects.count() : null
  }

  return activeProjects || []
}
