import {getQueue} from '../util'
import {generateNewProjectName} from '../../common/models/project'
import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {formProjectTeams} from '../../server/actions/formProjectTeams'

function getPlayerHandles(playerIds) {
  return r.table('players').getAll(...playerIds).pluck('handle')
    .run()
    .then(rows => rows.map(row => row.handle))
}

function processCycleLaunch(cycle) {
  return formProjectTeams(cycle.id)
    .then(projects => Promise.all(
      projects.map(project => initializeProjectChannel(project.name, project.cycleTeams[cycle.id].playerIds))
    ))
    .catch(e => console.log(e))
}

function initializeProjectChannel(channelName, playerIds) {
  const client = new ChatClient()
  return getPlayerHandles(playerIds)
    .then(handles => client.createChannel(channelName, handles.concat('lg-bot')))
    .then(() => client.sendMessage(channelName, `Welcome to the ${channelName} project channel!`))
}

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(({data: cycle}) => processCycleLaunch(cycle))
}
