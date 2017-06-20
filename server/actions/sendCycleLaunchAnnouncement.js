export default async function sendCycleLaunchAnnouncement(cycleId, phaseId) {
  const chatService = require('src/server/services/chatService')
  const {Cycle, Phase, Project} = require('src/server/services/dataService')

  const [cycle, phase, projects] = await Promise.all([
    await Cycle.get(cycleId),
    await Phase.get(phaseId),
    await Project.filter({cycleId, phaseId}).pluck('name', 'goal'),
  ])

  await chatService.sendChannelMessage(phase.channelName, _buildAnnouncement(cycle, projects))
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
