import ChatClient from '../../server/clients/ChatClient'
import r from '../../db/connect'
import {updateProjectStats} from '../../server/actions/updateProjectStats'
import {getProjectsForChapterInCycle} from '../../server/db/project'
import {findPlayersByIds} from '../../server/db/player'
import {findQuestionsByIds} from '../../server/db/question'
import {findResponsesBySurveyId} from '../../server/db/response'
import {getSurveyById} from '../../server/db/survey'
import {getQueue} from '../util'
import {
  STATS_QUESTION_TYPES,
  groupResponsesBySubject,
  filterQuestionsByType,
} from '../util/survey'

export function start() {
  const cycleCompleted = getQueue('cycleCompleted')
  cycleCompleted.process(({data: cycle}) =>
      processCompletedCycle(cycle)
      .catch(err => console.error(`Error handling cycleCompleted event for ${cycle.id}:`, err))
  )
}

export async function processCompletedCycle(cycle, chatClient = new ChatClient()) {
  console.log(`Completing cycle ${cycle.cycleNumber} of chapter ${cycle.chapterId}`)
  await updateStats(cycle, chatClient)
  await sendCompletionAnnouncement(cycle, chatClient)
}

function updateStats(cycle, chatClient) {
  return getProjectsForChapterInCycle(cycle.chapterId, cycle.id)
    .then(async projects =>
      await Promise.all(projects.map(async project => {
        await updateProjectStats(project, cycle.id)

        const cycleHistory = (project.cycleHistory || []).find(item => item.cycleId === cycle.id) || {}
        const cyclePlayerIds = cycleHistory.playerIds || []
        const cyclePlayers = await findPlayersByIds(cyclePlayerIds)

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
        const statsByPlayer = cyclePlayers.reduce((result, player) => {
          const projectCycleStats = ((((player.stats || {}).projects || {})[project.id] || {}).cycles || {})[cycle.id]
          result.set(player.id, projectCycleStats)
          playerHours.push({player, hours: projectCycleStats.hours || 0})
          return result
        }, new Map())

        return Promise.all(cyclePlayers.map(player => {
          const feedbackData = {
            project,
            cycle,
            team: cyclePlayers,
            teamResponses: generalFeedbackResponsesBySubject.get(player.id) || [],
            teamHours: playerHours,
            stats: statsByPlayer.get(player.id) || {},
          }

          return sendPlayerProjectStatsDM(player, feedbackData, chatClient)
        }))
      }))
    )
}

function sendPlayerProjectStatsDM(player, feedbackData, chatClient) {
  const {project, cycle, team, teamResponses, teamHours, playerStats} = feedbackData

  const teamFeedbackList = teamResponses.map(response => `- ${(response.body || '').trim()}`)
  const teamHoursList = teamHours.map(item => `@${item.player.handle} (${item.player.name}): ${item.hours}`)

  const playerRetroFeedbackMessage = `Retrospective results for #${project.name} (cycle ${cycle.cycleNumber}):

**Feedback from your team:**
${teamFeedbackList.join('\n')}

**Stats earned from this project:**
\`\`\`
Learning Support: ${playerStats.ls || 0}%
Culture Contribution: $${playerStats.cc || 0}%
\`\`\`

**Hours contributed:**
\`\`\`
Team size: ${team.length}
Your hours: ${playerStats.hours || 0}
All team hours: ${playerStats.teamHours || 0}

${teamHoursList.join('\n')}
\`\`\`

**Contribution to the project:**
Self-assessed: ${playerStats.rcSelf || 0}%
Team-assessed: ${playerStats.rcOther || 0}%

Your estimated contribution to the project: ${playerStats.rc || 0}%
Expected contribution for # of hours: ${playerStats.ec || 0}%
Contribution difference: ${playerStats.ecd || 0}%
`

  chatClient.sendDirectMessage(player.handle, playerRetroFeedbackMessage)
}

function sendCompletionAnnouncement(cycle, chatClient) {
  return r.table('chapters').get(cycle.chapterId).run()
    .then(chapter => {
      const announcement = `✅ *Cycle ${cycle.cycleNumber} is complete*.`
      return chatClient.sendChannelMessage(chapter.channelName, announcement)
    })
}
