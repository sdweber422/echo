import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findPlayersByIds} from 'src/server/db/player'
import {getCycleById} from 'src/server/db/cycle'
import {getStatByDescriptor} from 'src/server/db/stat'
import ChatClient from 'src/server/clients/ChatClient'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {groupResponsesBySubject} from 'src/server/util/survey'

export default async function sendPlayerStatsSummaries(project, cycleId, chatClient = new ChatClient()) {
  const cycle = await getCycleById(cycleId)
  const cycleHistory = (project.cycleHistory || []).find(item => item.cycleId === cycle.id) || {}
  const cyclePlayerIds = cycleHistory.playerIds || []
  const cyclePlayers = await findPlayersByIds(cyclePlayerIds)
  const cyclePlayerUsers = await getPlayerInfo(cyclePlayerIds)
  const players = _mergePlayerUsers(cyclePlayers, cyclePlayerUsers)

  const [retroSurvey, retroResponses] = await Promise.all([
    getSurveyById(cycleHistory.retrospectiveSurveyId),
    findResponsesBySurveyId(cycleHistory.retrospectiveSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)

  const generalFeedbackStatId = await getStatByDescriptor(STAT_DESCRIPTORS.GENERAL_FEEDBACK)('id')
  const generalFeedbackQuestions = retroQuestions.filter(({statId}) => statId === generalFeedbackStatId)
  const generalFeedbackResponsesBySubject = groupResponsesBySubject(retroResponses.filter(r => {
    return generalFeedbackQuestions.find(q => q.id === r.questionId)
  }))

  const playerHours = []
  const statsByPlayer = players.reduce((result, player) => {
    const projectStats = (((player.stats || {}).projects || {})[project.id] || {}) || {}
    result.set(player.id, projectStats)
    playerHours.push({player, hours: projectStats.hours || 0})
    return result
  }, new Map())

  return Promise.all(players.map(player => {
    const feedbackData = {
      project,
      team: players,
      teamResponses: generalFeedbackResponsesBySubject.get(player.id) || [],
      teamHours: playerHours,
      stats: statsByPlayer.get(player.id) || {},
    }

    const retroStatsMessage = _compilePlayerStatsMessage(player, feedbackData)

    return chatClient.sendDirectMessage(player.handle, retroStatsMessage).catch(err => {
      console.error(`\n\nThere was a problem while sending stats DM to player @${player.handle}`)
      console.error('Error:', err, err.stack)
      console.error(`Message: "${retroStatsMessage}"`)
    })
  }))
}

function _mergePlayerUsers(players, users) {
  const combined = new Map()

  players.forEach(player => combined.set(player.id, Object.assign({}, player)))

  users.forEach(user => {
    const values = combined.get(user.id)
    if (values) {
      combined.set(user.id, Object.assign({}, values, user))
    }
  })

  return Array.from(combined.values())
}

function _compilePlayerStatsMessage(player, feedbackData) {
  const {project, team, teamResponses, teamHours, stats} = feedbackData

  const teamFeedbackList = teamResponses.map(response => `- ${(response.value || '').trim()}`)
  const teamHoursList = teamHours.map(item => `@${item.player.handle} (${item.player.name}): ${item.hours}`)

  return `**RETROSPECTIVE RESULTS:** #${project.name}

**Feedback from your team:**
${teamFeedbackList.join('  \n\n')}

**Hours contributed:**
Team size: ${team.length}
Your hours: ${stats.hours || 0}
All team hours: ${stats.teamHours || 0}

${teamHoursList.join('  \n')}

**Contribution to the project:**
Self-assessed: ${stats.rcSelf || 0}%
Team-assessed: ${stats.rcOther || 0}%

Your estimated contribution to the project: ${stats.rc || 0}%
Expected contribution for # of hours: ${stats.ec || 0}%
Contribution difference: ${stats.ecd || 0}%

**Stats earned for this project:**
Learning Support: ${stats.th || 0}%
Culture Contribution: ${stats.cc || 0}%
Team Play: ${stats.tp || 0}%`
}
