import {connect} from 'src/db'
import ChatClient from 'src/server/clients/ChatClient'
import {processJobs} from 'src/server/util/queue'
import createPoolsForCycle from 'src/server/actions/createPoolsForCycle'

const r = connect()

export function start() {
  processJobs('cycleInitialized', processNewCycle)
}

export async function processNewCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Initializing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await createPoolsForCycle(cycle)
  await sendVotingAnnouncement(cycle, chatClient)
}

function sendVotingAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const banner = `🗳 *Voting is now open for cycle ${cycle.cycleNumber}*.`
      const votingInstructions = `Have a look at [the goal library](${chapter.goalRepositoryURL}/issues), then to get started check out \`/vote --help.\``
      const announcement = [banner, votingInstructions].join('\n')
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
