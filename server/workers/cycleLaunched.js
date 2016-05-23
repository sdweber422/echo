import {getQueue} from '../util'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {formProjectTeams} from '../../server/actions/formProjectTeams'

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(({data: cycle}) => processCycleLaunch(cycle))
}

function processCycleLaunch(cycle) {
  return formProjectTeams(cycle.id)
    .then(projects =>
      Promise.all(projects.map(project => initializeProjectChannel(project.name, project.cycleTeams[cycle.id].playerIds)))
        .then(() => sendCycleLaunchAnnouncement(cycle, projects))
    )
    .catch(e => console.log(e))
}

function initializeProjectChannel(channelName, playerIds) {
  const client = new ChatClient()
  return getPlayerHandles(playerIds)
    .then(handles => client.createChannel(channelName, handles.concat('lg-bot')))
    .then(() => client.sendMessage(channelName, `Welcome to the ${channelName} project channel!`))
}

function getPlayerHandles(playerIds) {
  return r.table('players').getAll(...playerIds).pluck('handle')
    .run()
    .then(rows => rows.map(row => row.handle))
}

function sendCycleLaunchAnnouncement(cycle, projects) {
  const projectListString = projects.map(p => `#${p.name}`).join(', ')
  const announcement = `🚀 The cycle been launched and the following projects have been created: ${projectListString}`
  const client = new ChatClient()

  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => client.sendMessage(chapter.channelName, announcement))
}
