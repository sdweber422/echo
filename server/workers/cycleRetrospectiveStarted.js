import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'

export function start() {
  const cycleRetrospectiveStarted = getQueue('cycleRetrospectiveStarted')
  cycleRetrospectiveStarted.process(({data: cycle}) => processRetrospectiveStarted(cycle))
}

function processRetrospectiveStarted(cycle) {
  console.log(`Starting retrospective for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  return sendRetroLaunchAnnouncement(cycle)
}

function sendRetroLaunchAnnouncement(cycle) {
  const announcement = `🤔  Time to start your retrospectives for cycle ${cycle.cycleNumber}!`

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => Promise.all([
      notifyChapterChannel(chapter, announcement),
      notifyProjectChannels(chapter, announcement),
    ]))
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
