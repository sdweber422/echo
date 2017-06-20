import Promise from 'bluebird'
import {Cycle, Phase, Project} from 'src/server/services/dataService'

export default async function sendCycleLaunchAnnouncements(cycleId) {
  const [cycle, phases] = await Promise.all([
    await Cycle.get(cycleId),
    await Phase.filter({hasVoting: true}),
  ])
  await Promise.each(phases, phase => _sendAnnouncementToPhase(cycle, phase))
}

async function _sendAnnouncementToPhase(cycle, phase) {
  const chatService = require('src/server/services/chatService')
  const projects = await Project.filter({cycleId: cycle.id, phaseId: phase.id}).pluck('name', 'goal')
  try {
    await chatService.sendChannelMessage(phase.channelName, _buildAnnouncement(cycle, projects))
  } catch (err) {
    console.warn(`Failed to send cycle launch announcement to Phase ${phase.number} members for cycle ${cycle.cycleNumber}: ${err}`)
  }
}

function _buildAnnouncement(cycle, projects) {
  let announcement = `🚀  *Cycle ${cycle.cycleNumber} has been launched!*\n`
  if (projects.length > 0) {
    const projectListString = projects.map(p => `  • #${p.name} - _${p.goal.title}_`).join('\n')
    announcement += `>The following projects have been created:\n${projectListString}`
  } else {
    announcement += '>No projects created'
  }
  return announcement
}
