import socketCluster from 'socketcluster-client'
import {getQueue} from '../util'

const scHostname = process.env.NODE_ENV === 'development' ? 'game.learnersguild.dev' : 'game.learnersguild.org'
const socket = socketCluster.connect({hostname: scHostname})
socket.on('connect', () => console.log('... socket connected'))
socket.on('disconnect', () => console.log('socket disconnected, will try to reconnect socket ...'))
socket.on('connectAbort', () => null)
socket.on('error', error => console.warn(error.message))

function processCycleLaunch(cycle) {
  socket.publish(`notifyChapter-${cycle.chapterId}`, 'Cycle Launched!')
  console.log(`[processCycleLaunch]: If I knew how, I'd assign teams now for cycle ${cycle.id}`)
}

export function start() {
  const cycleLaunched = getQueue('cycleLaunched')
  cycleLaunched.process(async ({data: cycle}) => processCycleLaunch(cycle))
}
