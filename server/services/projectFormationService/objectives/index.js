const MANDATORY_OBJECTIVES = [
  'eachTeamHasAnAdvancedPlayer',
]

const PRIORITIZED_OBJECTIVES = [
  'teamSizesMatchRecommendation',
  'nonAdvancedPlayersGotTheirVote',
  'advancedPlayersGotTheirVote',
]

export function scoreOnObjectives(pool, teams) {
  const mandatoryObjectivesScore = getScore(MANDATORY_OBJECTIVES, pool, teams)

  if (mandatoryObjectivesScore !== 1) {
    return 0
  }

  return getScore(PRIORITIZED_OBJECTIVES, pool, teams)
}

function getScore(objectives, pool, teams) {
  const scores = objectives.map(
    objective => require(`./${objective}`)(pool, teams)
  )
  const rawScore = getWeightedSum(scores)
  const maxPossibleRawScore = getMaxPossibleRawScore(objectives.length)

  return rawScore / maxPossibleRawScore
}

function getMaxPossibleRawScore(scoreCount) {
  return getWeightedSum(Array.from({length: scoreCount}, () => 1))
}

function getWeightedSum(scores) {
  return scores.reduce((sum, next, i, scores) => {
    const weight = Math.pow(10, scores.length - i)
    return sum + (next * weight)
  }, 0)
}
