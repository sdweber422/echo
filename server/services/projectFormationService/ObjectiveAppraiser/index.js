import getProfiler from 'src/server/services/projectFormationService/profile'

const MANDATORY_OBJECTIVES = [
  'AdvancedPlayersProjectsAllHaveSameGoal',
  'UnpopularGoalsNotConsidered',
]

const PRIORITIZED_OBJECTIVES = [
  'TeamSizesMatchRecommendation',
  'NonAdvancedPlayersGotTheirVote',
  'AdvancedPlayersGotTheirVote',
]

export default class ObjectiveAppraiser {
  constructor(pool) {
    this.pool = pool
    this.appraisers = new Map(
      PRIORITIZED_OBJECTIVES.concat(MANDATORY_OBJECTIVES).map(objective => {
        const ObjectiveClass = require(`./${objective}Appraiser`)
        const instance = new ObjectiveClass(pool)
        return [objective, instance]
      }))
  }

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    getProfiler().start('ObjectiveAppraiser.score')
    const mandatoryObjectivesScore = this._getScore(MANDATORY_OBJECTIVES, teamFormationPlan)

    if (mandatoryObjectivesScore !== 1) {
      return 0
    }

    const score = this._getScore(PRIORITIZED_OBJECTIVES, teamFormationPlan, {teamsAreIncomplete})

    getProfiler().pause('ObjectiveAppraiser.score')
    return score
  }

  _getScore(objectives, teamFormationPlan, {teamsAreIncomplete} = {}) {
    const self = this
    const scores = objectives.map(objective => {
      try {
        getProfiler().start(objective)
        const score = self.appraisers.get(objective).score(teamFormationPlan, {teamsAreIncomplete})
        getProfiler().pause(objective)
        return score
      } catch (err) {
        if (err.code && err.code === 'MODULE_NOT_FOUND') {
          throw new Error(`Could not load project formation algorithm objective [${objective}]: ${err}`)
        }
        throw err
      }
    })
    const rawScore = this._getWeightedSum(scores)
    const maxPossibleRawScore = this._getMaxPossibleRawScore(objectives.length)

    return rawScore / maxPossibleRawScore
  }

  _getMaxPossibleRawScore(scoreCount) {
    return this._getWeightedSum(Array.from({length: scoreCount}, () => 1))
  }

  _getWeightedSum(scores) {
    return scores.reduce((sum, next, i, scores) => {
      const weight = Math.pow(10, scores.length - i)
      return sum + (next * weight)
    }, 0)
  }
}
