import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'

export function start() {
  const cycleRetrospectiveStarted = getQueue('cycleRetrospectiveStarted')
  cycleRetrospectiveStarted.process(({data: cycle}) => processRetrospectiveStarted(cycle))
}

function processRetrospectiveStarted(cycle) {
  console.log(`Starting retrospective for cycle ${cycle.id}`)
  return sendRetroLaunchAnnouncement(cycle)
}

function sendRetroLaunchAnnouncement(cycle) {
  const announcement = `🤔  Time to start your retrospectives for cycle ${cycle.cycleNumber}!`
  const client = new ChatClient()

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => client.sendMessage(chapter.channelName, announcement))
}

