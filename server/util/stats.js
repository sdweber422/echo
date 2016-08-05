export function aggregateBuildCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution(rcScores) {
  if (!Array.isArray(rcScores) || !rcScores.length) {
    return null
  }
  const sum = rcScores.reduce((sum, n) => sum + n, 0)
  return Math.round(sum / rcScores.length)
}

export function expectedContribution(playerHours, teamHours) {
  if (playerHours === null || isNaN(playerHours) || !teamHours) {
    return null
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

export function learningSupport(lsScores) {
  return averageScore(lsScores)
}

export function cultureContrbution(ccScores) {
  return averageScore(ccScores)
}

export const SCORE_MIN = 1
export const SCORE_MAX = 7
export function averageScore(scores) {
  if (!Array.isArray(scores) || !scores.length) {
    return null
  }
  const adjustedScores = scores.filter(n => (n >= SCORE_MIN && n <= SCORE_MAX))
  const sum = adjustedScores.map(n => ((n - 1) / 6)).reduce((sum, n) => sum + n, 0)
  return Math.round((sum / adjustedScores.length) * 100)
}
