import {getSurveyById} from '../../server/db/survey'
import {findQuestionsByIds} from '../../server/db/question'
import {findResponsesBySurveyId} from '../../server/db/response'
import {savePlayerProjectStats} from '../../server/db/player'
import {getProjectHistoryForCycle} from '../../server/db/project'
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  learningSupport,
  cultureContrbution,
} from '../../server/util/stats'

const QUESTION_TYPES = {
  RELATIVE_CONTRIBUTION: 'RELATIVE_CONTRIBUTION',
  LEARNING_SUPPORT: 'LEARNING_SUPPORT',
  CULTURE_CONTRIBUTION: 'CULTURE_CONTRIBUTION',
  PROJECT_HOURS: 'PROJECT_HOURS',
}

export async function updateProjectStats(project, cycleId) {
  const projectCycle = getProjectHistoryForCycle(project, cycleId)
  const teamSize = projectCycle.playerIds.length
  const retroSurveyId = projectCycle.retrospectiveSurveyId

  const [retroSurvey, retroResponses] = await Promise.all([
    getSurveyById(retroSurveyId),
    findResponsesBySurveyId(retroSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)
  const retroQuestionMap = _mapById(retroQuestions)

  // hacky, brittle way of mapping stat types to questions
  // FIXME (ASAP): see https://github.com/LearnersGuild/game/issues/370
  const questionLS = _findQuestionByType(retroQuestions, QUESTION_TYPES.LEARNING_SUPPORT)
  const questionCC = _findQuestionByType(retroQuestions, QUESTION_TYPES.CULTURE_CONTRIBUTION)
  const questionRC = _findQuestionByType(retroQuestions, QUESTION_TYPES.RELATIVE_CONTRIBUTION)
  const questionHours = _findQuestionByType(retroQuestions, QUESTION_TYPES.PROJECT_HOURS)

  const projectResponses = []
  const playerResponses = []

  // separate responses about projects from responses about players
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

  const projectResponseGroups = _groupResponsesBySubject(projectResponses)
  const playerResponseGroups = _groupResponsesBySubject(playerResponses)

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
    const lsScores = []
    const ccScores = []
    const rcScores = []

    responseGroup.forEach(response => {
      const {
        questionId: responseQuestionId,
        value: responseValue,
      } = response

      switch (responseQuestionId) {
        case questionLS.id:
          lsScores.push(parseInt(responseValue, 10) || 0)
          break
        case questionCC.id:
          ccScores.push(parseInt(responseValue, 10) || 0)
          break
        case questionRC.id:
          rcScores.push(parseInt(responseValue, 10) || 0)
          break
        default:
          return
      }
    })

    const hours = teamPlayerHours.get(playerSubjectId) || 0

    const abc = aggregateBuildCycles(teamSize)
    const ls = learningSupport(lsScores)
    const cc = cultureContrbution(ccScores)
    const rc = relativeContribution(rcScores)
    const ec = expectedContribution(hours, teamHours)
    const ecd = expectedContributionDelta(ec, rc)
    const ecc = effectiveContributionCycles(abc, rc)

    playerStatsUpdates.push(
      savePlayerProjectStats(playerSubjectId, project.id, cycleId, {abc, rc, ec, ecd, ecc, ls, cc, hours})
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

function _findQuestionByType(questions, questionType) {
  // see see https://github.com/LearnersGuild/game/issues/370
  switch (questionType) {
    case QUESTION_TYPES.RELATIVE_CONTRIBUTION:
      return questions.find(q => {
        return q.responseType === 'relativeContribution'
      }) || {}

    case QUESTION_TYPES.LEARNING_SUPPORT:
      return questions.find(q => {
        return q.subjectType === 'player' &&
          q.responseType === 'likert7Agreement' &&
          q.body.includes('supported me in learning my craft')
      }) || {}

    case QUESTION_TYPES.CULTURE_CONTRIBUTION:
      return questions.find(q => {
        return q.subjectType === 'player' &&
          q.responseType === 'likert7Agreement' &&
          q.body.includes('contributed positively to our team culture')
      }) || {}

    case QUESTION_TYPES.PROJECT_HOURS:
      return questions.find(q => {
        return q.subjectType === 'project' &&
          q.responseType === 'text' &&
          q.body.includes('how many hours')
      }) || {}

    default:
      return {}
  }
}

function _groupResponsesBySubject(surveyResponses) {
  return surveyResponses.reduce((result, response) => {
    const {subjectId} = response

    if (!result.has(subjectId)) {
      result.set(subjectId, [])
    }
    result.get(subjectId).push(response)

    return result
  }, new Map())
}
