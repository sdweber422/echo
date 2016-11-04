import {connect} from 'src/db'
import ChatClient from 'src/server/clients/ChatClient'
import {processJobs} from 'src/server/util/queue'
import {getSocket} from 'src/server/util/socket'
import {findProjects} from 'src/server/db/project'
import {findModeratorsForChapter} from 'src/server/db/moderator'
import ensureCycleReflectionSurveysExist from 'src/server/actions/ensureCycleReflectionSurveysExist'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

const r = connect()

export function start() {
  processJobs('cycleReflectionStarted', processRetrospectiveStarted, notifyModeratorsAboutError)
}

async function processRetrospectiveStarted(cycle) {
  console.log(`Starting reflection for cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)

  await reloadSurveyAndQuestionData()
  await ensureCycleReflectionSurveysExist(cycle)
  await sendStartReflectionAnnouncement(cycle)

  console.log(`Cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId} reflection successfully started`)
}

async function sendStartReflectionAnnouncement(cycle) {
  const announcement = `🤔  *Time to start your reflection process for cycle ${cycle.cycleNumber}*!\n`
  const reflectionInstructions = 'To get started check out `/retro --help` and `/review --help`'

  const chapter = await r.table('chapters').get(cycle.chapterId)
  await Promise.all([
    notifyChapterChannel(chapter, announcement + reflectionInstructions),
    notifyProjectChannels(cycle, announcement + reflectionInstructions),
  ])
}

async function notifyModeratorsAboutError(cycle, originalErr) {
  try {
    await notifyModerators(cycle.chapterId, `❗️ **Error:** ${originalErr}`)
  } catch (err) {
    console.error(`Got this error [${err}] trying to notify moderators about this error [${originalErr}]`)
  }
}

function notifyModerators(chapterId, message) {
  const socket = getSocket()
  return findModeratorsForChapter(chapterId).then(moderators => {
    moderators.forEach(moderator => {
      socket.publish(`notifyUser-${moderator.id}`, message)
    })
  })
}

function notifyChapterChannel(chapter, message) {
  const client = new ChatClient()
  return client.sendChannelMessage(chapter.channelName, message)
}

function notifyProjectChannels(cycle, message) {
  const client = new ChatClient()
  return findProjects({chapterId: cycle.chapterId, cycleId: cycle.id})
    .then(projects => Promise.all(
      projects.map(project => client.sendChannelMessage(project.name, message))
    ))
}
