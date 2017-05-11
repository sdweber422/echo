import Promise from 'bluebird'
import {Project, Player, r} from 'src/server/services/dataService'
import {CLOSED, TRUSTED_PROJECT_REVIEW_START_DATE} from 'src/common/models/project'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import closeProject from 'src/server/actions/closeProject'
import {finish} from './util'

const {
  PROJECT_REVIEW_ACCURACY,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
  EXPERIENCE_POINTS,
} = STAT_DESCRIPTORS

run()
  .then(() => finish())
  .catch(finish)

async function run() {
  console.info('Initializing Player Review Stats From Baselines')
  await initializePlayerReviewStatsFromBaseline()

  const projects = await Project
    .between(TRUSTED_PROJECT_REVIEW_START_DATE, r.maxval, {index: 'closedAt'})
    .filter({state: CLOSED})

  console.info(`Re-closing ${projects.length} projects`)

  await Promise.each(projects, (project, i, total) => {
    console.log(
      `[${i + 1}/${total}]`,
      `Closing project ${project.name} (${project.id})`,
      `originally closed on ${project.closedAt.toDateString()}`,
    )
    return closeProject(project.id, {updateClosedAt: false})
  })
}

function initializePlayerReviewStatsFromBaseline() {
  return Player.update(row => ({
    stats: row('statsBaseline').default({}).pluck(
      PROJECT_REVIEW_ACCURACY,
      EXTERNAL_PROJECT_REVIEW_COUNT,
      INTERNAL_PROJECT_REVIEW_COUNT,
      EXPERIENCE_POINTS,
    )
  }))
}
