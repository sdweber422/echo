import {connect} from 'src/db'
import ChatClient from 'src/server/clients/ChatClient'

const r = connect()

export default function sendCycleLaunchAnnouncement(cycle, projects, options = {}) {
  const chatClient = options.chatClient || new ChatClient()
  let announcement = '🚀  *The cycle has been launched!*\n'
  if (projects.length > 0) {
    const projectListString = projects.map(p => `  • #${p.name} - _${p.goal.title}_`).join('\n')
    announcement += `The following projects have been created:\n${projectListString}`
  } else {
    announcement += 'No projects created'
  }

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => chatClient.sendChannelMessage(chapter.channelName, announcement))
}
