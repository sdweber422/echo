import {getQueue, graphQLFetcher} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {formProjectTeams} from '../../server/actions/formProjectTeams'
import {getTeamPlayerIds} from '../../server/db/project'

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(({data: cycle}) => processCycleLaunch(cycle))
}

function processCycleLaunch(cycle) {
  console.log(`Forming teams for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  return formProjectTeams(cycle.id)
    .then(projects =>
      Promise.all(projects.map(project => initializeProjectChannel(project.name, getTeamPlayerIds(project, cycle.id), project.goal)))
        .then(() => sendCycleLaunchAnnouncement(cycle, projects))
    )
    .catch(e => console.log(e))
}

async function initializeProjectChannel(channelName, playerIds, goal) {
  const goalIssueNum = goal.url.replace(/.*\/(\d+)$/, '$1')
  const goalLink = `[${goalIssueNum}: ${goal.title}](${goal.url})`
  const client = new ChatClient()

  const players = await getPlayerInfo(playerIds)
  await client.createChannel(channelName, players.map(p => p.handle).concat('echo'), goalLink)

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
  await client.sendMessage(channelName, projectWelcomeMessage1)
  await client.sendMessage(channelName, projectWelcomeMessage2)
}

function getPlayerInfo(playerIds) {
  return graphQLFetcher(process.env.IDM_BASE_URL)({
    query: 'query ($playerIds: [ID]!) { getUsersByIds(ids: $playerIds) { handle name } }',
    variables: {playerIds},
  }).then(result => result.data.getUsersByIds)
}

function sendCycleLaunchAnnouncement(cycle, projects) {
  const projectListString = projects.map(p => `#${p.name} - _${p.goal.title}_`).join('\n  • ')
  const announcement = `🚀  *The cycle has been launched!*
The following projects have been created:
  • ${projectListString}`
  const client = new ChatClient()

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => client.sendMessage(chapter.channelName, announcement))
}
