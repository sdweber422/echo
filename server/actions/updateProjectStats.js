import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {savePlayerProjectStats} from 'src/server/db/player'
import {getProjectHistoryForCycle} from 'src/server/db/project'
import {sum} from 'src/server/util'
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  learningSupport,
  cultureContrbution,
  teamPlay,
} from 'src/server/util/stats'
import {
  STATS_QUESTION_TYPES,
  groupResponsesBySubject,
  findQuestionByType,
} from 'src/server/util/survey'

export default async function updateProjectStats(project, cycleId) {
  const projectCycle = getProjectHistoryForCycle(project, cycleId)
  const teamSize = projectCycle.playerIds.length
  const retroSurveyId = projectCycle.retrospectiveSurveyId

  if (!projectCycle.retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${project.id}, cycle ${cycleId}`)
  }

  const [retroSurvey, retroResponses] = await Promise.all([
    getSurveyById(retroSurveyId),
    findResponsesBySurveyId(retroSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)

  // hacky, brittle way of mapping stat types to questions
  // FIXME (ASAP): see https://github.com/LearnersGuild/game/issues/370
  const questionLS = findQuestionByType(retroQuestions, STATS_QUESTION_TYPES.LEARNING_SUPPORT) || {}
  const questionCC = findQuestionByType(retroQuestions, STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION) || {}
  const questionTP = findQuestionByType(retroQuestions, STATS_QUESTION_TYPES.TEAM_PLAY) || {}
  const questionRC = findQuestionByType(retroQuestions, STATS_QUESTION_TYPES.RELATIVE_CONTRIBUTION) || {}
  const questionHours = findQuestionByType(retroQuestions, STATS_QUESTION_TYPES.PROJECT_HOURS) || {}

  const projectResponses = []
  const playerResponses = []

  // separate responses about projects from responses about players
  const retroQuestionMap = _mapById(retroQuestions)
  retroResponses.forEach(response => {
    const responseQuestion = retroQuestionMap.get(response.questionId)
    const {subjectType} = responseQuestion || {}

    switch (subjectType) {
      case 'project':
        projectResponses.push(response)
        break
      case 'team':
      case 'player':
        playerResponses.push(response)
        break
      default:
        return
    }
  })

  const projectResponseGroups = groupResponsesBySubject(projectResponses)
  const playerResponseGroups = groupResponsesBySubject(playerResponses)

  // calculate total hours worked by all team members
  let teamHours = 0
  const teamPlayerHours = new Map()
  projectResponseGroups.forEach(responseGroup => {
    responseGroup.forEach(response => {
      if (response.questionId === questionHours.id) {
        const playerHours = parseInt(response.value, 10) || 0
        teamHours += playerHours
        teamPlayerHours.set(response.respondentId, playerHours)
      }
    })
  })

  // dig out values needed for stats from question responses about each player
  const playerStatsUpdates = []
  playerResponseGroups.forEach((responseGroup, playerSubjectId) => {
    const scores = {
      ls: [],
      cc: [],
      tp: [],
      rc: [],
      rcSelf: [],
      rcOther: [],
    }

    responseGroup.forEach(response => {
      const {
        questionId: responseQuestionId,
        value: responseValue,
      } = response

      let value
      switch (responseQuestionId) {
        case questionLS.id:
          value = parseInt(responseValue, 10)
          if (!isNaN(value)) {
            scores.ls.push(value)
          }
          break

        case questionCC.id:
          value = parseInt(responseValue, 10)
          if (!isNaN(value)) {
            scores.cc.push(value)
          }
          break

        case questionTP.id:
          value = parseInt(responseValue, 10)
          if (!isNaN(value)) {
            scores.tp.push(value)
          }
          break

        case questionRC.id:
          value = parseInt(responseValue, 10) || 0
          if (!isNaN(value)) {
            scores.rc.push(value)
            if (response.respondentId === playerSubjectId) {
              scores.rcSelf.push(value)
            } else {
              scores.rcOther.push(value)
            }
          }
          break

        default:
          return
      }
    })

    const hours = teamPlayerHours.get(playerSubjectId) || 0

    const abc = aggregateBuildCycles(teamSize)
    const ls = learningSupport(scores.ls)
    const cc = cultureContrbution(scores.cc)
    const tp = teamPlay(scores.tp)
    const rc = relativeContribution(scores.rc)
    const ec = expectedContribution(hours, teamHours)
    const ecd = expectedContributionDelta(ec, rc)
    const ecc = effectiveContributionCycles(abc, rc)

    const stats = {
      ec, ecd,
      abc, ecc, ls, cc, tp,
      hours, teamHours, rc,
      rcSelf: scores.rcSelf.length ? Math.round(sum(scores.rcSelf) / scores.rcSelf.length) : 0,
      rcOther: scores.rcOther.length ? Math.round(sum(scores.rcOther) / scores.rcOther.length) : 0,
    }

    playerStatsUpdates.push(
      savePlayerProjectStats(playerSubjectId, project.id, cycleId, stats)
    )
  })

  await Promise.all(playerStatsUpdates)
}

function _mapById(arr) {
  return arr.reduce((result, el) => {
    result.set(el.id, el)
    return result
  }, new Map())
}
