import {getQueue} from '../util'
import {generateNewProjectName} from '../../common/models/project'
import ChatClient from '../../server/clients/ChatClient'

function processCycleLaunch(cycle) {
  console.log(`Launching ${cycle.id}`)
  const client = new ChatClient()
  const channelName = generateNewProjectName()
  return client.createChannel(channelName)
    .then(() => client.sendMessage(channelName, `Welcome to the ${channelName} project channel!`))
    .catch(err => console.error({err}))
}

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(({data: cycle}) => processCycleLaunch(cycle))
}
