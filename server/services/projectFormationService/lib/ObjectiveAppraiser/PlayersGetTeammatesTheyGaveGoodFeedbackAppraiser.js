import {repeat, flatten, sum} from '../util'
import {getPlayerIds} from '../pool'

export const STAT_WEIGHTS = {
  culture: 1,
  teamPlay: 1,
  technical: 0.25
}
export const NOVELTY_WEIGHT = 0.1
export const PERFECT_SCORE = sum([...Object.values(STAT_WEIGHTS), NOVELTY_WEIGHT])

export default class PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser {
  constructor(pool, {getFeedBack: injectedGetFeedback}) {
    this.pool = pool
    this.getFeedBack = injectedGetFeedback
  }

  score(teamFormationPlan) {
    const scoresForUnassignedPlayers = this.getScoresForUnassignedPlayers(teamFormationPlan)
    const scoresForAssignedPlayers = this.getScoresForAssignedPlayers(teamFormationPlan)

    const scores = scoresForAssignedPlayers.concat(scoresForUnassignedPlayers)
    return sum(scores) / scores.length
  }

  getScoresForUnassignedPlayers(teamFormationPlan) {
    const unassignedPlayerIds = new Set(getPlayerIds(this.pool))
    teamFormationPlan.teams.forEach(team =>
      team.playerIds.forEach(subjectId => {
        unassignedPlayerIds.delete(subjectId)
      })
    )
    return repeat(unassignedPlayerIds.size, 1)
  }

  getScoresForAssignedPlayers(teamFormationPlan) {
    const scoresForAssignedPlayers = teamFormationPlan.teams.map(team =>
      team.playerIds.map(subjectId => {
        const teammates = team.playerIds.filter(p => p !== subjectId)

        if (teammates.length === 0) {
          return 1
        }

        return teammates.map(respondentId => {
          const {culture, teamPlay, technical} = this.getFeedBack({respondentId, subjectId})
          const rawScore = (
            STAT_WEIGHTS.culture * culture +
            STAT_WEIGHTS.teamPlay * teamPlay +
            STAT_WEIGHTS.technical * technical
          )
          return rawScore / PERFECT_SCORE
        })
      })
    )
    return flatten(scoresForAssignedPlayers)
  }
}
