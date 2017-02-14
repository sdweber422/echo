import parseArgs from 'minimist'
import {Chapter, Cycle} from 'src/server/services/dataService'
import queueService from 'src/server/services/queueService'

const {finish} = require('./util')

run()
  .then(() => finish(null))
  .catch(err => finish(err))

async function run() {
  const {
    cycleNumber,
    chapterName = 'Oakland',
  } = parseArgs(process.argv.slice(2))

  if (!cycleNumber) {
    /* eslint-disable unicorn/no-process-exit */
    console.log('USAGE: npm run addProjectFormationCompleteEvent -- --cycleNumber XX [--chapterName name]')
    process.exit(1)
  }

  const chapter = await Chapter.filter({name: chapterName}).nth(0)
  const cycle = await Cycle.filter({chapterId: chapter.id, cycleNumber}).nth(0)

  const projectFormationQueue = queueService.getQueue('projectFormationComplete')
  await projectFormationQueue.add(cycle, {
    attempts: 3,
    backoff: {type: 'fixed', delay: 10000},
  })

  console.log(`projectFormationComplete event for ${chapterName} cycle ${cycleNumber} placed in queue`)
}
