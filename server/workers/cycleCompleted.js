import {connect} from 'src/db'
import ChatClient from 'src/server/clients/ChatClient'
import {processJobs} from 'src/server/util/queue'

const r = connect()

export function start() {
  processJobs('cycleCompleted', processCompletedCycle)
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
