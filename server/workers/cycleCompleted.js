import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {getQueue} from '../util'

export function start() {
  const cycleCompleted = getQueue('cycleCompleted')
  cycleCompleted.process(({data: cycle}) =>
      processCompletedCycle(cycle)
      .catch(err => console.error(`Error handling cycleCompleted event for ${cycle.id}:`, err, err.stack))
  )
}

export async function processCompletedCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
