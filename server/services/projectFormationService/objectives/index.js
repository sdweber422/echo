const MANDATORY_OBJECTIVES = [
  'advancedPlayersTeamCountDoesNotExceedMax',
  'advancedPlayersProjectsAllHaveSameGoal',
]

const PRIORITIZED_OBJECTIVES = [
  'teamSizesMatchRecommendation',
  'nonAdvancedPlayersGotTheirVote',
  'advancedPlayersGotTheirVote',
]

export function scoreOnObjectives(pool, teamFormationPlan, {teamsAreIncomplete} = {}) {
  const mandatoryObjectivesScore = getScore(MANDATORY_OBJECTIVES, pool, teamFormationPlan)

  if (mandatoryObjectivesScore !== 1) {
    return 0
  }

  return getScore(PRIORITIZED_OBJECTIVES, pool, teamFormationPlan, {teamsAreIncomplete})
}

function getScore(objectives, pool, teamFormationPlan, {teamsAreIncomplete} = {}) {
  const scores = objectives.map(objective => {
    try {
      return require(`./${objective}`)(pool, teamFormationPlan, {teamsAreIncomplete})
    } catch (err) {
      if (err.code && err.code === 'MODULE_NOT_FOUND') {
        throw new Error(`Inavlid project formation algorithm objective: ${objective}`)
      }
      throw err
    }
  })
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
