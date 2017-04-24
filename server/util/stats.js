import elo from 'elo-rank'

import {LGInternalServerError} from 'src/server/util/error'

import {
  avg,
  toPercent,
  roundDecimal,
  range,
  attrCompareFn,
} from 'src/common/util'
import {
  STAT_DESCRIPTORS,
  RELEVANT_EXTERNAL_REVIEW_COUNT,
  MIN_EXTERNAL_REVIEW_COUNT_FOR_ACCURACY,
} from 'src/common/models/stat'
import {PROJECT_DEFAULT_EXPECTED_HOURS} from 'src/common/models/project'

export const LIKERT_SCORE_NA = 0
export const LIKERT_SCORE_MIN = 1
export const LIKERT_SCORE_MAX = 7

const {
  CULTURE_CONTRIBUTION,
  ESTIMATION_ACCURACY,
  EXPERIENCE_POINTS,
  ELO,
  LEVEL,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
  PROJECT_REVIEW_EXPERIENCE,
  PROJECT_REVIEW_ACCURACY,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  INTERNAL_PROJECT_REVIEW_COUNT,
  PROJECT_COMPLETENESS,
  PROJECT_HOURS,
  RAW_PROJECT_COMPLETENESS,
} = STAT_DESCRIPTORS

export function relativeContributionAggregateCycles(numPlayers, numBuildCycles = 1) {
  if (numPlayers === null || numBuildCycles === null || isNaN(numPlayers) || isNaN(numBuildCycles)) {
    return null
  }
  return numPlayers * numBuildCycles
}

export function relativeContribution({playerRCScoresById, playerEstimationAccuraciesById, playerHours, teamHours}) {
  const rawContribution = relativeContributionRaw({playerRCScoresById, playerEstimationAccuraciesById})
  const scaledContribution = _scaleContributionBasedOnHours({
    rawContribution,
    playerHours,
    teamHours,
    teamSize: playerRCScoresById.size,
  })
  return Math.round(scaledContribution)
}

export function relativeContributionRaw({playerRCScoresById, playerEstimationAccuraciesById}) {
  if (_scoresShouldBeAveraged(playerRCScoresById, playerEstimationAccuraciesById)) {
    return Math.round(avg(Array.from(playerRCScoresById.values())))
  }

  let highestAccuracyPlayerId
  let highestAccuracy = 0
  for (const [playerId, accuracy] of playerEstimationAccuraciesById.entries()) {
    if (accuracy > highestAccuracy) {
      highestAccuracy = accuracy
      highestAccuracyPlayerId = playerId
    }
  }

  return playerRCScoresById.get(highestAccuracyPlayerId)
}

function _scoresShouldBeAveraged(playerRCScoresById, playerEstimationAccuraciesById) {
  return (
    !playerEstimationAccuraciesById ||
    playerEstimationAccuraciesById.size === 0 ||
    playerEstimationAccuraciesById.size < playerRCScoresById.size ||
    _mapContainsFalseyValue(playerEstimationAccuraciesById) ||
    _mapValuesAreEqual(playerEstimationAccuraciesById)
  )
}

function _mapValuesAreEqual(map) {
  const values = Array.from(map.values())
  if (!values || values.length === 0) {
    return true
  }
  const first = values[0]
  return values.every(value => first === value)
}

function _mapContainsFalseyValue(map) {
  const values = Array.from(map.values())
  return !values.every(value => Boolean(value))
}

function _scaleContributionBasedOnHours({rawContribution, playerHours, teamHours, teamSize}) {
  if (teamSize === 1 || rawContribution === 0) {
    return rawContribution
  }

  const rcHourly = rawContribution / playerHours

  const otherRC = (100 - rawContribution)
  const otherRcHourly = otherRC / (teamHours - playerHours)

  return toPercent(rcHourly / (rcHourly + otherRcHourly * (teamSize - 1)))
}

export function relativeContributionExpected(playerHours, teamHours) {
  if (playerHours === null || isNaN(playerHours) || isNaN(teamHours)) {
    return null
  }
  if (teamHours === 0) {
    return 0
  }
  return Math.round(toPercent(playerHours / teamHours))
}

export function relativeContributionDelta(relativeContributionExpected, relativeContribution) {
  if (relativeContributionExpected === null || relativeContribution === null || isNaN(relativeContributionExpected) || isNaN(relativeContribution)) {
    return null
  }
  return relativeContribution - relativeContributionExpected
}

export function relativeContributionEffectiveCycles(relativeContributionAggregateCycles, relativeContribution) {
  if (relativeContributionAggregateCycles === null || relativeContribution === null || isNaN(relativeContributionAggregateCycles) || isNaN(relativeContribution)) {
    return null
  }
  return relativeContributionAggregateCycles * relativeContribution
}

export function relativeContributionOther(contributionRatingsFromTeammates) {
  if (contributionRatingsFromTeammates.length === 0) {
    return 100
  }
  return roundDecimal(avg(contributionRatingsFromTeammates)) || 0
}

export const technicalHealth = likert7Average
export const cultureContribution = likert7Average
export const cultureContributionStructure = likert7Average
export const cultureContributionSafety = likert7Average
export const cultureContributionTruth = likert7Average
export const cultureContributionChallenge = likert7Average
export const cultureContributionSupport = likert7Average
export const cultureContributionEngagement = likert7Average
export const cultureContributionEnjoyment = likert7Average
export const teamPlay = likert7Average
export const teamPlayReceptiveness = likert7Average
export const teamPlayFlexibleLeadership = likert7Average
export const teamPlayResultsFocus = likert7Average
export const teamPlayFrictionReduction = likert7Average

export function likert7Average(scores) {
  return averageScoreInRange(LIKERT_SCORE_MIN, LIKERT_SCORE_MAX, scores)
}

export function averageScoreInRange(minScore, maxScore, scores) {
  if (isNaN(minScore)) {
    throw new LGInternalServerError('Invalid score range min')
  }
  if (isNaN(maxScore)) {
    throw new LGInternalServerError('Invalid score range max')
  }
  if (minScore > maxScore) {
    throw new LGInternalServerError('Min score must be less than or equal to max score')
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

export function experiencePoints(teamHours, relativeContribution) {
  return roundDecimal(teamHours * (relativeContribution / 100))
}

export function experiencePointsV2(args) {
  const {
    projectCompleteness,
    teamSize,
    recommendedTeamSize,
    dynamic,
    baseXp,
    bonusXp,
    relativeContribution = 100
  } = args

  const teamBonusThreshold = 0.7
  const completenessPercentage = projectCompleteness / 100
  const relativeContributionPercentage = relativeContribution / 100

  const scaledBaseXp = dynamic ?
    (baseXp / recommendedTeamSize) * teamSize :
    baseXp

  const baseXpEarned = scaledBaseXp * completenessPercentage * relativeContributionPercentage
  const bonusXpEarned = Math.max(completenessPercentage - teamBonusThreshold, 0) /
    (1 - teamBonusThreshold) *
    bonusXp

  return roundDecimal(baseXpEarned + bonusXpEarned)
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
    roundDecimal(_applyStretchFactor(scoreA / (scoreA + scoreB))),
    roundDecimal(_applyStretchFactor(scoreB / (scoreB + scoreA))),
  ]
}

const STRETCH_FACTOR = 3
function _applyStretchFactor(unstretchedScore) {
  const stretchedScore = ((unstretchedScore - 0.5) * STRETCH_FACTOR) + 0.5
  if (stretchedScore > 1) {
    return 1
  }
  if (stretchedScore < 0) {
    return 0
  }

  return stretchedScore
}

// see: https://playbook.learnersguild.org/Game_Manual/Levels_and_Roles.html#level-requirements
export const LEVELS = [{
  [LEVEL]: 0,
  requirements: {
    [EXPERIENCE_POINTS]: 0,
    [ELO]: 0,
    [ESTIMATION_ACCURACY]: 0,
  },
}, {
  [LEVEL]: 1,
  requirements: {
    [EXPERIENCE_POINTS]: 100,
    [ELO]: 900,
    [ESTIMATION_ACCURACY]: 80,
  },
}, {
  [LEVEL]: 2,
  requirements: {
    [EXPERIENCE_POINTS]: 200,
    [ELO]: 990,
    [ESTIMATION_ACCURACY]: 91,
  },
}, {
  [LEVEL]: 3,
  requirements: {
    [EXPERIENCE_POINTS]: 450,
    [ELO]: 1020,
    [ESTIMATION_ACCURACY]: 92,
  },
}, {
  [LEVEL]: 4,
  requirements: {
    [EXPERIENCE_POINTS]: 700,
    [ELO]: 1050,
    [ESTIMATION_ACCURACY]: 93,
  }
}, {
  [LEVEL]: 5,
  requirements: {
    [EXPERIENCE_POINTS]: 950,
    [ELO]: 1070,
    [ESTIMATION_ACCURACY]: 94,
  },
}]

const LEVELS_DESC = LEVELS.slice().reverse()

export function computePlayerLevel(playerStats) {
  const playerLevelStats = {
    [ELO]: extractStat(playerStats, 'elo.rating', intStatFormatter),
    [EXPERIENCE_POINTS]: extractStat(playerStats, EXPERIENCE_POINTS, intStatFormatter),
    [CULTURE_CONTRIBUTION]: extractStat(playerStats, `weightedAverages.${CULTURE_CONTRIBUTION}`),
    [TEAM_PLAY]: extractStat(playerStats, `weightedAverages.${TEAM_PLAY}`),
    [TECHNICAL_HEALTH]: extractStat(playerStats, `weightedAverages.${TECHNICAL_HEALTH}`),
    [ESTIMATION_ACCURACY]: extractStat(playerStats, `weightedAverages.${ESTIMATION_ACCURACY}`),
  }

  for (const {level, requirements} of LEVELS_DESC) {
    const playerMeetsRequirements = Object.keys(requirements).every(stat => playerLevelStats[stat] >= requirements[stat])
    if (playerMeetsRequirements) {
      return level
    }
  }

  throw new LGInternalServerError('Level could not be determined')
}

export function floatStatFormatter(value) {
  return parseFloat(Number(value).toFixed(2))
}

export function intStatFormatter(value) {
  return parseInt(value, 10)
}

export function extractStat(stats, statSelector, formatter = floatStatFormatter) {
  const statParts = statSelector.split('.')
  const statValue = statParts.reduce((statValue, statPart, i) => {
    if (i === statParts.length - 1) {
      return statValue[statPart] || 0
    }
    return statValue[statPart] || {}
  }, stats || {})

  return formatter(statValue)
}

function _validatePlayer(player) {
  if (!player) {
    throw new LGInternalServerError('Invalid player object')
  }
  if (isNaN(player.rating)) {
    throw new LGInternalServerError('Invalid player rating')
  }
  if (isNaN(player.score)) {
    throw new LGInternalServerError('Invalid player score')
  }
  if (isNaN(player.kFactor)) {
    throw new LGInternalServerError('Invalid player kFactor')
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

export function calculateProjectReviewStats(project, projectReviews) {
  const isExternal = review => !project.playerIds.includes(review.player.id)

  const mostAccurateExternalReview = projectReviews
    .filter(isExternal)
    .sort(_compareByMostExperiencedReviewer)[0]

  const rawCompleteness = mostAccurateExternalReview ?
    mostAccurateExternalReview.responses[PROJECT_COMPLETENESS] :
    null

  const scaledCompleteness = _scaleCompletenessByHoursWorked(rawCompleteness, project)

  return {
    [PROJECT_COMPLETENESS]: scaledCompleteness,
    [RAW_PROJECT_COMPLETENESS]: rawCompleteness,
  }
}

function _compareByMostExperiencedReviewer(a, b) {
  return (
    b.player.stats[PROJECT_REVIEW_EXPERIENCE] - a.player.stats[PROJECT_REVIEW_EXPERIENCE] ||
    b.player.stats[PROJECT_REVIEW_ACCURACY] - a.player.stats[PROJECT_REVIEW_ACCURACY] ||
    b.player.id.localeCompare(a.player.id)
  )
}

function _scaleCompletenessByHoursWorked(rawCompleteness, project) {
  if (rawCompleteness === null) {
    return null
  }

  if (!(project.stats && project.stats[PROJECT_HOURS])) {
    return rawCompleteness
  }

  const teamSize = project.playerIds.length
  const expectedProjectHours = teamSize * PROJECT_DEFAULT_EXPECTED_HOURS
  const scaledCompleteness = (expectedProjectHours / project.stats[PROJECT_HOURS]) * rawCompleteness
  return Math.min(scaledCompleteness, 100)
}

export function calculateProjectReviewStatsForPlayer(player, projectReviewInfoList) {
  const isExternal = reviewInfo => !reviewInfo.project.playerIds.includes(player.id)
  const projectHasCompleteness = reviewInfo => Number.isFinite((reviewInfo.project.stats || {})[PROJECT_COMPLETENESS])
  const externalReviewInfoList = projectReviewInfoList.filter(projectReview => (
    isExternal(projectReview) && projectHasCompleteness(projectReview)
  ))
  const compareClosedAt = attrCompareFn('closedAt')
  const recentExternalReviewInfoList = externalReviewInfoList
    .sort(({project: a}, {project: b}) => compareClosedAt(a, b))
    .reverse()
    .slice(0, RELEVANT_EXTERNAL_REVIEW_COUNT)

  const baseline = player.statsBaseline || {}
  const internalCountBaseline = baseline[INTERNAL_PROJECT_REVIEW_COUNT] || 0
  const externalCountBaseline = baseline[EXTERNAL_PROJECT_REVIEW_COUNT] || 0
  const reviewAccuracyBaseline = baseline[PROJECT_REVIEW_ACCURACY] || 0

  const stats = {}
  stats[EXTERNAL_PROJECT_REVIEW_COUNT] = externalReviewInfoList.length + externalCountBaseline
  stats[INTERNAL_PROJECT_REVIEW_COUNT] = (projectReviewInfoList.length - externalReviewInfoList.length) + internalCountBaseline

  if (stats[EXTERNAL_PROJECT_REVIEW_COUNT] >= MIN_EXTERNAL_REVIEW_COUNT_FOR_ACCURACY) {
    const externalReviewAccuracies =
      recentExternalReviewInfoList.map(({project, projectReviews}) => {
        const thisPlayersReview = projectReviews.find(_ => _.player.id === player.id)
        return Math.abs(
          thisPlayersReview.responses[PROJECT_COMPLETENESS] - project.stats[RAW_PROJECT_COMPLETENESS]
        )
      })
      .map(delta => 100 - delta)
    const consideredExternalReviewAccuracies = [
      ...externalReviewAccuracies,
      ...range(1, externalCountBaseline).map(_ => reviewAccuracyBaseline)
    ].slice(0, RELEVANT_EXTERNAL_REVIEW_COUNT)
    stats[PROJECT_REVIEW_ACCURACY] = avg(consideredExternalReviewAccuracies)
  } else {
    stats[PROJECT_REVIEW_ACCURACY] = (((player.stats || {})[ELO] || {}).rating || 0) / 100
  }

  stats[PROJECT_REVIEW_EXPERIENCE] = stats[PROJECT_REVIEW_ACCURACY] + (stats[EXTERNAL_PROJECT_REVIEW_COUNT] / 20)

  return stats
}
