import {REFLECTION, PRACTICE} from 'src/common/models/cycle'
import {r, getLatestCycleForChapter} from 'src/server/services/dataService'

export default async function findActiveProjectsForChapter(chapterId, options = {}) {
  const latestCycle = await getLatestCycleForChapter(chapterId, {default: null})

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
