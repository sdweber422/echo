import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import createRetrospectiveSurveys from '../../server/actions/createRetrospectiveSurveys'
import r from '../../db/connect'

import raven from 'raven'
const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

export function start() {
  const cycleRetrospectiveStarted = getQueue('cycleRetrospectiveStarted')
  cycleRetrospectiveStarted.process(({data: cycle}) => processRetrospectiveStarted(cycle))
}

async function processRetrospectiveStarted(cycle) {
  try {
    console.log(`Starting retrospective for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
    await createRetrospectiveSurveys(cycle)
    await sendRetroLaunchAnnouncement(cycle)
  } catch (err) {
    console.error(err.stack)
    sentry.captureException(err)
    await sendRetroLaunchError(cycle, err)
  }
}

function sendRetroLaunchAnnouncement(cycle) {
  const announcement = `🤔  Time to start your retrospectives for cycle ${cycle.cycleNumber}!`

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => Promise.all([
      notifyChapterChannel(chapter, announcement),
      notifyProjectChannels(chapter, announcement),
    ]))
}

function sendRetroLaunchError(cycle, err) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter =>
      notifyChapterChannel(chapter, `❗️ **ERROR:** Failed to create project retrospective surveys. ${err}`)
    )
}

// TODO: these seem more generic than this one worker.
// Consider moving them. Maybe to ChatClient?
function notifyChapterChannel(chapter, announcement) {
  const client = new ChatClient()
  return client.sendMessage(chapter.channelName, announcement)
}

function notifyProjectChannels(chapter, announcement) {
  const client = new ChatClient()
  return r.table('projects').getAll(chapter.id, {index: 'chapterId'}).run()
    .then(projects => Promise.all(
      projects.map(project => client.sendMessage(project.name, announcement))
    ))
}
