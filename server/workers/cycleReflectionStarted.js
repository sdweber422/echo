import raven from 'raven'

import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import {getProjectsForChapterInCycle} from '../../server/db/project'
import {parseQueryError} from '../../server/db/errors'
import createCycleReflectionSurveys from '../../server/actions/createCycleReflectionSurveys'
import reloadSurveyAndQuestionData from '../../server/actions/reloadSurveyAndQuestionData'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export function start() {
  const cycleReflectionStarted = getQueue('cycleReflectionStarted')
  cycleReflectionStarted.process(({data: cycle}) => processRetrospectiveStarted(cycle))
}

async function processRetrospectiveStarted(cycle) {
  try {
    console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
    await reloadSurveyAndQuestionData()
    await createCycleReflectionSurveys(cycle)
    await sendRetroLaunchAnnouncement(cycle)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
    await sendRetroLaunchError(cycle, err)
  }
}

function sendRetroLaunchAnnouncement(cycle) {
  const announcement = `🤔  *Time to start your reflection process for cycle ${cycle.cycleNumber}*!\n`
  const reflectionInstructions = 'To get started check out `/retro --help` and `/review --help`'

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => Promise.all([
      notifyChapterChannel(chapter, announcement + reflectionInstructions),
      notifyProjectChannels(cycle, announcement + reflectionInstructions),
    ]))
}

function sendRetroLaunchError(cycle, err) {
  err = parseQueryError(err)
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter =>
      notifyChapterChannel(chapter, `❗️ **ERROR:** Failed to create project retrospective surveys. ${err}`)
    )
}

function notifyChapterChannel(chapter, announcement) {
  const client = new ChatClient()
  return client.sendMessage(chapter.channelName, announcement)
}

function notifyProjectChannels(cycle, announcement) {
  const client = new ChatClient()
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(projects => Promise.all(
      projects.map(project => client.sendMessage(project.name, announcement))
    ))
}
