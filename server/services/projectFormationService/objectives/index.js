const MANDATORY_OBJECTIVES = [
  // 'advancedPlayersTeamCountDoesNotExceedMax',
  'advancedPlayersProjectsAllHaveSameGoal',
]

const PRIORITIZED_OBJECTIVES = [
  'teamSizesMatchRecommendation',
  'nonAdvancedPlayersGotTheirVote',
  'advancedPlayersGotTheirVote',
]

export function scoreOnObjectives(pool, teams, {teamsAreIncomplete} = {}) {
  const mandatoryObjectivesScore = getScore(MANDATORY_OBJECTIVES, pool, teams)

  if (mandatoryObjectivesScore !== 1) {
    return 0
  }

  return getScore(PRIORITIZED_OBJECTIVES, pool, teams, {teamsAreIncomplete})
}

function getScore(objectives, pool, teams, {teamsAreIncomplete} = {}) {
  const scores = objectives.map(objective => {
    try {
      return require(`./${objective}`)(pool, teams, {teamsAreIncomplete})
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
