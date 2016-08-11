import getPlayerInfo from '../../server/actions/getPlayerInfo'
import {findResponsesBySurveyId} from '../../server/db/response'
import {getSurveyById} from '../../server/db/survey'
import {findQuestionsByIds} from '../../server/db/question'
import {findPlayersByIds} from '../../server/db/player'
import {getCycleById} from '../../server/db/cycle'
import ChatClient from '../../server/clients/ChatClient'
import {
  STATS_QUESTION_TYPES,
  groupResponsesBySubject,
  filterQuestionsByType,
} from '../util/survey'

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

  const generalFeedbackQuestions = filterQuestionsByType(retroQuestions, STATS_QUESTION_TYPES.GENERAL_FEEDBACK)
  const generalFeedbackResponsesBySubject = groupResponsesBySubject(retroResponses.filter(r => {
    return generalFeedbackQuestions.find(q => q.id === r.questionId)
  }))

  const playerHours = []
  const statsByPlayer = players.reduce((result, player) => {
    const projectCycleStats = ((((player.stats || {}).projects || {})[project.id] || {}).cycles || {})[cycle.id] || {}
    result.set(player.id, projectCycleStats)
    playerHours.push({player, hours: projectCycleStats.hours || 0})
    return result
  }, new Map())

  return Promise.all(players.map(player => {
    const feedbackData = {
      project,
      cycle,
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
  const {project, cycle, team, teamResponses, teamHours, stats} = feedbackData

  const teamFeedbackList = teamResponses.map(response => `- ${(response.value || '').trim()}`)
  const teamHoursList = teamHours.map(item => `@${item.player.handle} (${item.player.name}): ${item.hours}`)

  return `**RETROSPECTIVE RESULTS:** #${project.name} (cycle ${cycle.cycleNumber})

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
Learning Support: ${stats.ls || 0}%
Culture Contribution: ${stats.cc || 0}%`
}
