/* eslint-disable no-multi-spaces */
import elo from 'elo-rank'

import {roundDecimal} from 'src/common/util'
import {avg, toPercent} from './index'

export const LIKERT_SCORE_NA = 0
export const LIKERT_SCORE_MIN = 1
export const LIKERT_SCORE_MAX = 7

export function aggregateBuildCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution(rcScores) {
  return Math.round(avg(rcScores))
}

export function expectedContribution(playerHours, teamHours) {
  if (playerHours === null || isNaN(playerHours) || isNaN(teamHours)) {
    return null
  }
  if (teamHours === 0) {
    return 0
  }
  return Math.round(toPercent(playerHours / teamHours))
}

export function expectedContributionDelta(ec, rc) {
  if (ec === null || rc === null || isNaN(ec) || isNaN(rc)) {
    return null
  }
  return rc - ec
}

export function effectiveContributionCycles(abc, rc) {
  if (abc === null || rc === null || isNaN(abc) || isNaN(rc)) {
    return null
  }
  return abc * rc
}

export const technicalHealth    = likert7Average
export const cultureContribution = likert7Average
export const cultureContributionStructure = likert7Average
export const cultureContributionSafety = likert7Average
export const cultureContributionTruth = likert7Average
export const cultureContributionChallenge = likert7Average
export const cultureContributionSupport = likert7Average
export const cultureContributionEngagement = likert7Average
export const cultureContributionEnjoyment = likert7Average
export const teamPlay           = likert7Average
export const receptiveness      = likert7Average
export const flexibleLeadership = likert7Average
export const resultsFocus       = likert7Average
export const frictionReduction  = likert7Average

export function likert7Average(scores) {
  return averageScoreInRange(LIKERT_SCORE_MIN, LIKERT_SCORE_MAX, scores)
}

export function averageScoreInRange(minScore, maxScore, scores) {
  if (isNaN(minScore)) {
    throw new Error('Invalid score range min')
  }
  if (isNaN(maxScore)) {
    throw new Error('Invalid score range max')
  }
  if (minScore > maxScore) {
    throw new Error('Min score must be less than or equal to max score')
  }
  if (!Array.isArray(scores)) {
    return null
  }
  // exclude scores outside of valid range
  // shift score values down by min to produce range 0...n
  const adjusted = scores
                    .filter(n => (n >= minScore && n <= maxScore))
                    .map(n => n - minScore)
  const adjustedAvg = avg(adjusted)
  const range = maxScore - minScore
  return Math.round(toPercent(adjustedAvg / range))
}

export function experiencePoints(teamHours, rc) {
  return roundDecimal(teamHours * (rc / 100))
}

/**
 * params:
 *   players (obj array) -> [playerA, playerB]
 *     - rating
 *     - score (game score)
 *     - kFactor
 *
 * returns:
 *   result (int array) -> [newRatingA, newRatingB]
 */
export function eloRatings([playerA, playerB]) {
  _validatePlayer(playerA)
  _validatePlayer(playerB)

  const {rating: ratingA, score: scoreA, kFactor: kFactorA} = playerA
  const {rating: ratingB, score: scoreB, kFactor: kFactorB} = playerB

  const eloA = elo(kFactorA)
  const eloB = elo(kFactorB)

  const expectedMarginA = eloA.getExpected(ratingA, ratingB)
  const expectedMarginB = eloB.getExpected(ratingB, ratingA)

  const [actualMarginA, actualMarginB] = scoreMargins([scoreA, scoreB])

  const newRatingA = eloA.updateRating(expectedMarginA, actualMarginA, ratingA)
  const newRatingB = eloB.updateRating(expectedMarginB, actualMarginB, ratingB)

  return [newRatingA, newRatingB]
}

export function scoreMargins([scoreA, scoreB]) {
  if (scoreA === 0 && scoreB === 0) {
    return [0, 0]
  }

  return [
    roundDecimal(scoreA / (scoreA + scoreB)),
    roundDecimal(scoreB / (scoreB + scoreA)),
  ]
}

/* eslint-disable key-spacing */
// see: https://playbook.learnersguild.org/Game_Manual/Levels_and_Roles.html#level-requirements
// FIXME: missing -- XP/week, estimation accuracy, # of reviews
export const LEVELS = [
  {level: 0, xp:    0, elo:    0, cc:  0, tp:  0, th:  0},
  {level: 1, xp:    0, elo:  900, cc: 65, tp: 65, th:  0},
  {level: 2, xp:  150, elo: 990, cc: 80, tp: 80, th:  0},
  {level: 3, xp:  500, elo: 1020, cc: 85, tp: 85, th: 80},
  {level: 4, xp:  750, elo: 1100, cc: 90, tp: 90, th: 90},
  {level: 5, xp: 1000, elo: 1150, cc: 90, tp: 90, th: 95},
]
/* eslint-enable key-spacing */

export function computePlayerLevel(player) {
  const {
    elo,
    xp,
    cc,
    tp,
    th,
  } = _playerLevelStats(player)

  const levelsDescending = LEVELS.slice().reverse()
  for (const levelInfo of levelsDescending) {
    const {
      level,
      elo: lvlElo,
      xp: lvlXp,
      cc: lvlCc,
      tp: lvlTp,
      th: lvlTh,
    } = levelInfo

    if (xp >= lvlXp && elo >= lvlElo && cc >= lvlCc && tp >= lvlTp && th >= lvlTh) {
      return level
    }
  }

  throw new Error(`Could not place this player in ANY level! ${player.id}`)
}

export const floatStatFormatter = value => parseFloat(Number(value).toFixed(2))
export const intStatFormatter = value => parseInt(value, 10)
export function getPlayerStat(player, statName, formatter = floatStatFormatter) {
  const statParts = statName.split('.')
  const statValue = statParts.reduce((statValue, statPart, i) => {
    if (i === statParts.length - 1) {
      return statValue[statPart] || 0
    }
    return statValue[statPart] || {}
  }, player.stats || {})

  return formatter(statValue)
}

function _playerLevelStats(player) {
  return {
    elo: getPlayerStat(player, 'elo.rating', intStatFormatter),
    xp: getPlayerStat(player, 'xp', intStatFormatter),
    cc: getPlayerStat(player, 'weightedAverages.cc'),
    tp: getPlayerStat(player, 'weightedAverages.tp'),
    th: getPlayerStat(player, 'weightedAverages.th'),
  }
}

function _validatePlayer(player) {
  if (!player) {
    throw new Error('Invalid player object')
  }
  if (isNaN(player.rating)) {
    throw new Error('Invalid player rating')
  }
  if (isNaN(player.score)) {
    throw new Error('Invalid player score')
  }
  if (isNaN(player.kFactor)) {
    throw new Error('Invalid player kFactor')
  }
}

export function findValueForReponseQuestionStat(responseArr, statDescriptor) {
  if (!Array.isArray(responseArr) || !statDescriptor) {
    return
  }
  return (responseArr.find(response => (
    ((response.question || {}).stat || {}).descriptor === statDescriptor
  )) || {}).value
}
