import {sum} from './index'

export function aggregateBuildCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution(rcScores) {
  if (!Array.isArray(rcScores)) {
    return null
  }
  if (!rcScores.length) {
    return 0
  }
  const rcScoresSum = sum(rcScores)
  return Math.round(rcScoresSum / rcScores.length)
}

export function expectedContribution(playerHours, teamHours) {
  if (playerHours === null || isNaN(playerHours) || isNaN(teamHours)) {
    return null
  }
  if (teamHours === 0) {
    return 0
  }
  return Math.round((playerHours / teamHours) * 100)
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

export function learningSupport(scores) {
  return averageScore(scores)
}

export function cultureContrbution(scores) {
  return averageScore(scores)
}

export function teamPlay(scores) {
  return averageScore(scores)
}

export const SCORE_MIN = 1
export const SCORE_MAX = 7
export const SCORE_RANGE = SCORE_MAX - SCORE_MIN
export function averageScore(scores) {
  if (!Array.isArray(scores)) {
    return null
  }

  const adjustedScores = scores.filter(n => (n >= SCORE_MIN && n <= SCORE_MAX)).map(n => n - SCORE_MIN)
  if (!adjustedScores.length) {
    return 0
  }

  const adjustedScoresSum = sum(adjustedScores.map(n => n / SCORE_RANGE))
  const averageScorePercent = Math.round((adjustedScoresSum / adjustedScores.length) * 100)
  return averageScorePercent
}
