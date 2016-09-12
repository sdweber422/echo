/**
 * Extracts peer-review values from responses to retrospective survey questions
 * submitted by a project's team members. Uses these values to compute & update
 * each project member's project-specific and overall stats.
 */
import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {savePlayerProjectStats, findPlayersByIds} from 'src/server/db/player'
import {getProjectHistoryForCycle} from 'src/server/db/project'
import {avg, mapById, safePush, toPairs, roundDecimal} from 'src/server/util'
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  learningSupport,
  cultureContrbution,
  teamPlay,
  eloRatings,
} from 'src/server/util/stats'
import {
  STATS_QUESTION_TYPES,
  groupResponsesBySubject,
  findQuestionByType,
} from 'src/server/util/survey'

const INITIAL_RATINGS = {
  DEFAULT: 1000,
}
const K_FACTORS = {
  BEGINNER: 100,
  DEFAULT: 20,
}

export default async function updateProjectStats(project, cycleId) {
  const projectCycle = getProjectHistoryForCycle(project, cycleId)
  if (!projectCycle) {
    throw new Error(`Cycle history not found for project ${project.id} cycle ${cycleId}`)
  }

  const {playerIds, retrospectiveSurveyId} = projectCycle
  if (!playerIds || !playerIds.length) {
    throw new Error(`Project team playersnot found for project ${project.id}`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${project.id}`)
  }

  const [projectTeamPlayers, retroSurvey, retroResponses] = await Promise.all([
    findPlayersByIds(playerIds),
    getSurveyById(retrospectiveSurveyId),
    findResponsesBySurveyId(retrospectiveSurveyId),
  ])

  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)
  const retroQuestionsById = mapById(retroQuestions)
  const statsQuestions = _findStatsQuestions(retroQuestions)

  const allResponseGroups = _responseGroups(retroResponses, retroQuestionsById)
  const projectResponseGroups = groupResponsesBySubject(allResponseGroups.project)
  const playerResponseGroups = groupResponsesBySubject(allResponseGroups.player)

  const teamPlayersById = mapById(projectTeamPlayers)

  // calculate total hours worked by all team members
  let teamHours = 0
  const teamPlayerHours = new Map()
  projectResponseGroups.forEach(responseGroup => {
    responseGroup.forEach(response => {
      if (response.questionId === statsQuestions.hours.id) {
        const playerHours = parseInt(response.value, 10) || 0
        teamHours += playerHours
        teamPlayerHours.set(response.respondentId, playerHours)
      }
    })
  })

  // compute stats for each team member based on (retro) survey responses
  const playerProjectStats = new Map()
  playerResponseGroups.forEach((playerResponseGroup, playerSubjectId) => {
    const player = teamPlayersById.get(playerSubjectId)

    if (!player) {
      console.error(new Error(`Survey responses found for a player ${playerSubjectId} who is not on project ${project.id}; player stats skipped`))
      return
    }

    const hours = teamPlayerHours.get(playerSubjectId) || 0
    const scores = _extractPlayerScores(statsQuestions, playerResponseGroup, playerSubjectId)
    const abc = aggregateBuildCycles(projectTeamPlayers.length)
    const ls = learningSupport(scores.ls)
    const cc = cultureContrbution(scores.cc)
    const tp = teamPlay(scores.tp)
    const rc = relativeContribution(scores.rc.all)
    const rcSelf = scores.rc.self || 0
    const rcOther = roundDecimal(avg(scores.rc.other)) || 0
    const rcPerHour = hours && rc ? roundDecimal(rc / hours) : 0
    const ec = expectedContribution(hours, teamHours)
    const ecd = expectedContributionDelta(ec, rc)
    const ecc = effectiveContributionCycles(abc, rc)

    const stats = {
      ec, ecd, abc, ecc,
      ls, cc, tp, hours, teamHours,
      rc, rcSelf, rcOther, rcPerHour,
      elo: (player.stats || {}).elo || {}, // pull current overall Elo stats
    }

    playerProjectStats.set(playerSubjectId, {
      playerId: playerSubjectId,
      projectId: project.id,
      stats,
    })
  })

  // match each player against each other player,
  // updating ratings with the result of every match
  _updatePlayerRatings(playerProjectStats)

  const playerStatsUpdates = Array.from(playerProjectStats.values()).map(item => {
    return savePlayerProjectStats(item.playerId, item.projectId, item.stats)
  })

  await Promise.all(playerStatsUpdates)
}

function _findStatsQuestions(questions) {
  // FIXME: brittle, inefficient way of mapping stat types to questions
  // see https://github.com/LearnersGuild/game/issues/370
  return {
    ls: findQuestionByType(questions, STATS_QUESTION_TYPES.LEARNING_SUPPORT) || {},
    cc: findQuestionByType(questions, STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION) || {},
    tp: findQuestionByType(questions, STATS_QUESTION_TYPES.TEAM_PLAY) || {},
    rc: findQuestionByType(questions, STATS_QUESTION_TYPES.RELATIVE_CONTRIBUTION) || {},
    hours: findQuestionByType(questions, STATS_QUESTION_TYPES.PROJECT_HOURS) || {},
  }
}

function _responseGroups(responses, questionsById) {
  // separate responses about projects from responses about players
  const project = []
  const player = []

  responses.forEach(response => {
    const responseQuestion = questionsById.get(response.questionId)
    const {subjectType} = responseQuestion || {}

    switch (subjectType) {
      case 'project':
        project.push(response)
        break
      case 'team':
      case 'player':
        player.push(response)
        break
      default:
        return
    }
  })

  return {
    project,
    player
  }
}

function _extractPlayerScores(statsQuestions, playerResponseGroup, playerSubjectId) {
  // extract values needed for each player's stats
  // from survey responses submitted about them
  const scores = {
    ls: [],
    cc: [],
    tp: [],
    rc: {
      all: [],
      self: null,
      other: [],
    },
  }

  playerResponseGroup.forEach(response => {
    const {
      questionId: responseQuestionId,
      value: responseValue,
    } = response

    switch (responseQuestionId) {
      case statsQuestions.ls.id:
        safePush(scores.ls, responseValue)
        break

      case statsQuestions.cc.id:
        safePush(scores.cc, responseValue)
        break

      case statsQuestions.tp.id:
        safePush(scores.tp, responseValue)
        break

      case statsQuestions.rc.id:
        safePush(scores.rc.all, responseValue)
        if (response.respondentId === playerSubjectId) {
          scores.rc.self = parseInt(responseValue, 10)
        } else {
          safePush(scores.rc.other, responseValue)
        }
        break

      default:
        return
    }
  })

  return scores
}

function _updatePlayerRatings(playerStats) {
  const scoreboard = new Map()

  playerStats.forEach(ps => {
    const {playerId, stats = {}} = ps
    const {elo = {}} = stats

    scoreboard.set(playerId, {
      id: playerId,
      rating: elo.rating || INITIAL_RATINGS.DEFAULT,
      matches: elo.matches || 0,
      kFactor: _kFactor(elo.matches),
      score: stats.rcPerHour, // effectiveness
    })
  })

  // sorted by elo (descending) solely for the sake of being deterministic
  const sortedPlayerIds = Array.from(scoreboard.values())
                            .sort((a, b) => b.rating - a.rating)
                            .map(item => item.id)

  // pair every team player up to run "matches"
  const matches = toPairs(sortedPlayerIds)

  // for each team player pair, update ratings based on relative effectiveness
  matches.forEach(playerIdPair => {
    const playerA = scoreboard.get(playerIdPair[0])
    const playerB = scoreboard.get(playerIdPair[1])

    const matchResults = eloRatings([playerA, playerB])

    playerA.rating = matchResults[0]
    playerA.matches++
    playerA.kFactor = _kFactor(playerA.matches)

    playerB.rating = matchResults[1]
    playerB.matches++
    playerB.kFactor = _kFactor(playerB.matches)
  })

  // copy team scoreboard data into provided stats objects (meh.)
  scoreboard.forEach((updatedPlayerElo, playerId) => {
    const {rating, matches, score, kFactor} = updatedPlayerElo
    playerStats.get(playerId).stats.elo = {rating, matches, score, kFactor}
  })
}

function _kFactor(numMatches) {
  return (numMatches || 0) < 20 ?
    K_FACTORS.BEGINNER :
    K_FACTORS.DEFAULT
}
