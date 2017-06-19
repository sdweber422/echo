import logger from 'src/server/util/logger'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import initializeProject from 'src/server/actions/initializeProject'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectCreated', processProjectCreated)
}

export async function processProjectCreated(project) {
  const chatService = require('src/server/services/chatService')

  await initializeProject(project)

  const {goal} = project
  const players = await getPlayerInfo(project.playerIds)
  const playerHandles = players.map(p => p.handle)

  try {
    await chatService.sendDirectMessage(playerHandles, _welcomeMessage(project, goal, players))
  } catch (err) {
    logger.warn(err)
  }
}

function _welcomeMessage(project, goal, players) {
  const goalLink = `<${goal.url}|${goal.number}: ${goal.title}>`
  return `
🎊 *Welcome to the ${project.name} project!* 🎊

*Your goal is:* ${goalLink}

*Your team is:*
${players.map(p => `• _${p.name}_ - @${p.handle}`).join('\n  ')}

*Time to start work on your project!*

>The first step is to create an appropriate project artifact.
>Once you've created the artifact, connect it to your project with the \`/project set-artifact\` command.

Run \`/project set-artifact --help\` for more guidance.`
}
