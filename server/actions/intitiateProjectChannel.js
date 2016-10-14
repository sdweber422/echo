import ChatClient from 'src/server/clients/ChatClient'

export default async function intitiateProjectChannel(project, players, options = {}) {
  const channelName = project.name
  const chatClient = options.chatClient || new ChatClient()

  console.log(`Initializing project channel #${channelName}`)

  const {goal} = project
  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const goalLink = `[${goalIssueNum}: ${goal.title}](${goal.url})`

  await chatClient.createChannel(channelName, players.map(p => p.handle).concat('echo'), goalLink)

  // Split welcome message into 2 so that the goal link preview
  // is inserted right after the goal link.
  const projectWelcomeMessage1 = `🎊 *Welcome to the ${channelName} project channel!* 🎊

*Your goal is:* ${goalLink}
`

  const projectWelcomeMessage2 = `*Your team is:*
  ${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

The first step is to create an appropriate project artifact.
Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.
`

  await chatClient.sendChannelMessage(channelName, projectWelcomeMessage1)
  await chatClient.sendChannelMessage(channelName, projectWelcomeMessage2)
}
