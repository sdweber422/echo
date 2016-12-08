/**
 * Extracts peer-review values from responses to retrospective survey questions
 * submitted by a project's team members. Uses these values to compute & update
 * each project member's project-specific and overall stats.
 */
import {userCan} from 'src/common/util'
import {getSurveyById} from 'src/server/db/survey'
import {findQuestionsByIds} from 'src/server/db/question'
import {findResponsesBySurveyId} from 'src/server/db/response'
import {savePlayerProjectStats, findPlayersByIds} from 'src/server/db/player'
import {statsByDescriptor} from 'src/server/db/stat'
import {avg, sum, mapById, safePushInt, toPairs, roundDecimal} from 'src/server/util'
import {
  aggregateBuildCycles,
  relativeContribution,
  expectedContribution,
  expectedContributionDelta,
  effectiveContributionCycles,
  eloRatings,
  experiencePoints,
  technicalHealth,
  cultureContribution,
  cultureContributionStructure,
  cultureContributionSafety,
  cultureContributionTruth,
  cultureContributionChallenge,
  cultureContributionSupport,
  cultureContributionEngagement,
  cultureContributionEnjoyment,
  teamPlay,
  receptiveness,
  flexibleLeadership,
  resultsFocus,
  frictionReduction,
} from 'src/server/util/stats'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {groupResponsesBySubject} from 'src/server/util/survey'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

const INITIAL_RATINGS = {
  DEFAULT: 1000,
}
const K_FACTORS = {
  BEGINNER: 100,
  DEFAULT: 20,
}

export default async function updatePlayerStatsForProject(project) {
  const {playerIds, retrospectiveSurveyId} = project
  if (!playerIds || playerIds.length === 0) {
    throw new Error(`No players found on team for project ${project.id}`)
  }
  if (!retrospectiveSurveyId) {
    throw new Error(`Retrospective survey ID not set for project ${project.id}`)
  }

  const retroSurvey = await getSurveyById(retrospectiveSurveyId)
  const retroResponses = await findResponsesBySurveyId(retrospectiveSurveyId)
  const retroQuestionIds = retroSurvey.questionRefs.map(qref => qref.questionId)
  const retroQuestions = await findQuestionsByIds(retroQuestionIds)

  const statsQuestions = await _getStatsQuestions(retroQuestions)
  const playerResponsesById = _getPlayerResponsesBySubjectId(retroResponses, retroQuestions)

  // compute all stats and initialize Elo rating
  const playerStatsConfigsById = await _getPlayersStatsConfig(project.playerIds)
  const computeStats = await _computeStatsClosure(project, retroResponses, statsQuestions, playerStatsConfigsById)
  const teamPlayersStats = Array.from(playerResponsesById.values())
    .map(responses => computeStats(responses, statsQuestions))

  // compute updated Elo ratings and merge them in
  const playersWithEloStats = teamPlayersStats
    .filter(({playerId}) => !playerStatsConfigsById.get(playerId).ignoreWhenComputingElo)
  const eloRatings = _computeEloRatings(playersWithEloStats)
  const teamPlayersStatsWithUpdatedEloRatings = teamPlayersStats.map(stats => {
    const updatedElo = eloRatings.get(stats.playerId)
    if (!updatedElo) {
      return stats
    }
    const {rating, matches, kFactor, score} = updatedElo
    return {...stats, elo: {rating, matches, kFactor, score}}
  })

  const playerStatsUpdates = teamPlayersStatsWithUpdatedEloRatings.map(({playerId, ...stats}) => {
    return savePlayerProjectStats(playerId, project.id, stats)
  })

  await Promise.all(playerStatsUpdates)
}

function _getPlayerResponsesBySubjectId(retroResponses, retroQuestions) {
  const retroQuestionsById = mapById(retroQuestions)
  const playerResponses = retroResponses.filter(response => {
    const responseQuestion = retroQuestionsById.get(response.questionId)
    const {subjectType} = responseQuestion || {}
    return subjectType === 'player' || subjectType === 'team'
  })

  return groupResponsesBySubject(playerResponses)
}

async function _getStatsQuestions(questions) {
  const stats = await statsByDescriptor()
  const getQ = descriptor => questions.filter(_ => _.statId === stats[descriptor].id)[0] || {}

  return {
    th: getQ(STAT_DESCRIPTORS.TECHNICAL_HEALTH),
    rc: getQ(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION),
    hours: getQ(STAT_DESCRIPTORS.PROJECT_HOURS),
    challenge: getQ(STAT_DESCRIPTORS.CHALLENGE),
    cc: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION),
    cultureContributionStructure: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_STRUCTURE),
    cultureContributionSafety: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SAFETY),
    cultureContributionTruth: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_TRUTH),
    cultureContributionChallenge: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE),
    cultureContributionSupport: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_SUPPORT),
    cultureContributionEngagement: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENGAGEMENT),
    cultureContributionEnjoyment: getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_ENJOYMENT),
    tp: getQ(STAT_DESCRIPTORS.TEAM_PLAY),
    receptiveness: getQ(STAT_DESCRIPTORS.RECEPTIVENESS),
    resultsFocus: getQ(STAT_DESCRIPTORS.RESULTS_FOCUS),
    flexibleLeadership: getQ(STAT_DESCRIPTORS.FLEXIBLE_LEADERSHIP),
    frictionReduction: getQ(STAT_DESCRIPTORS.FRICTION_REDUCTION),
  }
}

async function _getPlayersStatsConfig(playerIds) {
  const users = await getPlayerInfo(playerIds)
  const playerStatsConfigs = users.map(user => ({
    id: user.id,
    ignoreWhenComputingElo: userCan(user, 'beIgnoredWhenComputingElo'),
  }))

  return mapById(playerStatsConfigs)
}

function _playerResponsesForQuestionById(retroResponses, questionId, valueFor = _ => _) {
  const responses = retroResponses.filter(_ => _.questionId === questionId)

  return responses.reduce((result, response) => {
    result.set(response.respondentId, valueFor(response.value))
    return result
  }, new Map())
}

async function _computeStatsClosure(project, retroResponses, statsQuestions, playerStatsConfigsById) {
  const projectTeamPlayers = await findPlayersByIds(project.playerIds)
  const teamPlayersById = mapById(projectTeamPlayers)
  const teamPlayerHours = _playerResponsesForQuestionById(retroResponses, statsQuestions.hours.id, _ => parseInt(_, 10))
  const teamPlayerChallenges = _playerResponsesForQuestionById(retroResponses, statsQuestions.challenge.id)
  const teamHours = sum(Array.from(teamPlayerHours.values()))

  // create a stats-computation function based on a closure of the passed-in
  // parameters as well as some additional derived data
  return (responses, statsQuestions) => {
    const playerId = responses[0].subjectId
    const player = teamPlayersById.get(playerId)
    if (!player) {
      console.error(new Error(`Survey responses found for a player ${playerId} who is not on project ${project.id}; player stats skipped`))
      return
    }

    const scores = _extractPlayerScores(statsQuestions, responses, playerId)

    const stats = {}
    stats.playerId = playerId // will be removed later
    stats.teamHours = teamHours
    stats.hours = teamPlayerHours.get(playerId) || 0
    stats.challenge = teamPlayerChallenges.get(playerId)
    stats.abc = aggregateBuildCycles(project.playerIds.length)
    stats.th = technicalHealth(scores.th)
    stats.cc = cultureContribution(scores.cc)
    stats.cultureContributionStructure = cultureContributionStructure(scores.cultureContributionStructure)
    stats.cultureContributionSafety = cultureContributionSafety(scores.cultureContributionSafety)
    stats.cultureContributionTruth = cultureContributionTruth(scores.cultureContributionTruth)
    stats.cultureContributionChallenge = cultureContributionChallenge(scores.cultureContributionChallenge)
    stats.cultureContributionSupport = cultureContributionSupport(scores.cultureContributionSupport)
    stats.cultureContributionEngagement = cultureContributionEngagement(scores.cultureContributionEngagement)
    stats.cultureContributionEnjoyment = cultureContributionEnjoyment(scores.cultureContributionEnjoyment)
    stats.tp = teamPlay(scores.tp)
    stats.receptiveness = receptiveness(scores.receptiveness)
    stats.resultsFocus = resultsFocus(scores.resultsFocus)
    stats.flexibleLeadership = flexibleLeadership(scores.flexibleLeadership)
    stats.frictionReduction = frictionReduction(scores.frictionReduction)
    stats.rc = relativeContribution(scores.rc.all)
    stats.rcSelf = scores.rc.self || 0
    stats.rcOther = roundDecimal(avg(scores.rc.other)) || 0
    stats.rcPerHour = stats.hours && stats.rc ? roundDecimal(stats.rc / stats.hours) : 0
    stats.ec = expectedContribution(stats.hours, stats.teamHours)
    stats.ecd = expectedContributionDelta(stats.ec, stats.rc)
    stats.ecc = effectiveContributionCycles(stats.abc, stats.rc)
    stats.xp = experiencePoints(teamHours, stats.rc)
    if (!playerStatsConfigsById.get(playerId).ignoreWhenComputingElo) {
      stats.elo = (player.stats || {}).elo || {} // pull current overall Elo stats
    }

    return stats
  }
}

function _extractPlayerScores(statsQuestions, responses, playerId) {
  // extract values needed for each player's stats
  // from survey responses submitted about them
  const scores = {
    th: [],
    cc: [],
    cultureContributionStructure: [],
    cultureContributionSafety: [],
    cultureContributionTruth: [],
    cultureContributionChallenge: [],
    cultureContributionSupport: [],
    cultureContributionEngagement: [],
    cultureContributionEnjoyment: [],
    tp: [],
    receptiveness: [],
    flexibleLeadership: [],
    resultsFocus: [],
    frictionReduction: [],
    rc: {
      all: [],
      self: null,
      other: [],
    },
  }
  const appendScoreStats = Object.keys(scores).filter(_ => _ !== 'rc')

  responses.forEach(response => {
    const {
      questionId: responseQuestionId,
      value: responseValue,
    } = response

    switch (responseQuestionId) {
      case statsQuestions.rc.id:
        safePushInt(scores.rc.all, responseValue)
        if (response.respondentId === playerId) {
          scores.rc.self = parseInt(responseValue, 10)
        } else {
          safePushInt(scores.rc.other, responseValue)
        }
        break

      default:
        appendScoreStats.forEach(stat => {
          if (responseQuestionId === statsQuestions[stat].id) {
            safePushInt(scores[stat], responseValue)
          }
        })
        break
    }
  })

  return scores
}

function _computeEloRatings(playerStats) {
  const scoreboard = playerStats
    .reduce((result, {playerId, ...stats}) => {
      const {elo = {}} = stats
      result.set(playerId, {
        id: playerId,
        rating: elo.rating || INITIAL_RATINGS.DEFAULT,
        matches: elo.matches || 0,
        kFactor: _kFactor(elo.matches),
        score: stats.rcPerHour, // effectiveness
      })
      return result
    }, new Map())

  // sorted by elo (descending) solely for the sake of being deterministic
  const sortedPlayerIds = Array.from(scoreboard.values())
                            .sort((a, b) => a.rating - b.rating)
                            .map(item => item.id)

  // pair every team player up to run "matches"
  const matches = toPairs(sortedPlayerIds)

  // for each team player pair, update ratings based on relative effectiveness
  matches.forEach(([playerIdA, playerIdB]) => {
    const playerA = scoreboard.get(playerIdA)
    const playerB = scoreboard.get(playerIdB)
    const [playerRatingA, playerRatingB] = eloRatings([playerA, playerB])

    playerA.rating = playerRatingA
    playerA.matches++
    playerA.kFactor = _kFactor(playerA.matches)

    playerB.rating = playerRatingB
    playerB.matches++
    playerB.kFactor = _kFactor(playerB.matches)
  })

  return scoreboard
}

function _kFactor(numMatches) {
  return (numMatches || 0) < 20 ?
    K_FACTORS.BEGINNER :
    K_FACTORS.DEFAULT
}
