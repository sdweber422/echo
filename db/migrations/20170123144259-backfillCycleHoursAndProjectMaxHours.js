import {median} from 'src/server/util'
import {Chapter, Cycle, Project} from 'src/server/services/dataService'

export async function up(r) {
  const chapters = await Chapter.run()
  const updateChapterPromises = chapters.map(chapter => backfillHoursForChapter(r, chapter))
  await Promise.all(updateChapterPromises)
}

export async function down(r) {
  r.table('projects').replace(project => project.without('expectedHours'))
  r.table('cycles').replace(cycle => cycle.without('projectDefaultExpectedHours'))
}

export async function backfillHoursForChapter(r, chapter) {
  console.log('backfilling hours for chapter', chapter.name)
  const chapterCycles = await Cycle.filter({chapterId: chapter.id}).orderBy('cycleNumber')
  const updateCyclePromises = chapterCycles.map(cycle => backfillHoursForCycle(r, chapter, cycle))
  await Promise.all(updateCyclePromises)
}

export async function backfillHoursForCycle(r, chapter, cycle) {
  console.log(`backfilling hours for ${chapter.name} cycle`, cycle.cycleNumber)
  const projectDefaultExpectedHours = await hoursForCycle(r, cycle)
  const cycleProjects = await Project.filter({chapterId: chapter.id, cycleId: cycle.id})
  const projectUpdates = cycleProjects.map(async project => {
    console.log(`backfilling hours for #${project.name}:`, projectDefaultExpectedHours)
    project.expectedHours = projectDefaultExpectedHours
    await project.save()
  })
  await Promise.all(projectUpdates)
  cycle.projectDefaultExpectedHours = projectDefaultExpectedHours
  await cycle.save()
}

function hoursForCycle(r, cycle) {
  const {cycleNumber} = cycle
  switch (cycleNumber) {
    case 14:
      return Promise.resolve(32)
    case 15:
      return Promise.resolve(40)
    case 16:
      return Promise.resolve(40)
    case 17:
      return Promise.resolve(40)
    case 18:
      return Promise.resolve(32)
    case 19:
      return Promise.resolve(40)
    case 20:
      return Promise.resolve(20)
    default:
      return nearestFullDayHours(r, cycle)
  }
}

async function nearestFullDayHours(r, cycle) {
  const medianReportedHours = await getMedianReportedHoursForCycle(r, cycle)
  const numDays = Math.floor(medianReportedHours / 8)
  const remainingHours = medianReportedHours % 8
  const nearestDayHourBoundary = 8 * numDays + ((remainingHours > 4) ? 8 : 0)

  return nearestDayHourBoundary
}

async function getMedianReportedHoursForCycle(r, cycle) {
  // inspired by server/actions/updateProjectStats:getProjectStats
  const allReportedHoursForProjectsInCycle = await r.table('projects')
    .filter({cycleId: cycle.id})
    .map(project => {
      return r.table('responses')
        .filter({subjectId: project('id')})
        .group('questionId')('value').ungroup()
        .eqJoin('group', r.table('questions'))
        .map(row => row('left').merge({statId: row('right')('statId').default(null)}))
        .eqJoin('statId', r.table('stats'))
        .map(row => row('left').merge({descriptor: row('right')('descriptor').default(null)}))
        .map(row => r.object(row('descriptor'), row('reduction')))
        .fold(r.object(), (acc, next) => acc.merge(next))('projectHours').default([40])
    })
    .concatMap(hours => hours)

  // if no hours were reported for the cycle, use 40
  if (allReportedHoursForProjectsInCycle.length === 0) {
    allReportedHoursForProjectsInCycle.push(40)
  }

  return Math.round(median(allReportedHoursForProjectsInCycle))
}
