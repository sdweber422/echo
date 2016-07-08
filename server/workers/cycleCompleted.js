import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'

export function start() {
  const cycleCompleted = getQueue('cycleCompleted')
  cycleCompleted.process(({data: cycle}) => processCompletedCycle(cycle))
}

export async function processCompletedCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendMessage(chapter.channelName, announcement)
    })
}
