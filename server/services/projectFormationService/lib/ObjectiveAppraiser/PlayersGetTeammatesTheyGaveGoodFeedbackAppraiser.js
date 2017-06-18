import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

import {repeat, flatten, sum} from '../util'
import {getPlayerIds, getUserFeedback} from '../pool'

export const FEEDBACK_TYPE_WEIGHTS = {
  [FEEDBACK_TYPE_DESCRIPTORS.TEAM_PLAY]: 1,
  [FEEDBACK_TYPE_DESCRIPTORS.TECHNICAL_COMPREHENSION]: 0.25
}

export const NOVELTY_WEIGHT = 1
export const PERFECT_SCORE = sum([...Object.values(FEEDBACK_TYPE_WEIGHTS), NOVELTY_WEIGHT])

export default class PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser {
  constructor(pool) {
    this.pool = pool
    this.feedbackCache = {}
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
          return this.getScoreForPairing({respondentId, subjectId})
        })
      })
    )
    return flatten(scoresForAssignedPlayers)
  }

  getScoreForPairing({respondentId, subjectId}) {
    const feedback = this.getFeedback({respondentId, subjectId})

    if (!feedback) {
      return 1
    }

    const weightedScores = Object.entries(feedback).map(([feedbackType, value]) => FEEDBACK_TYPE_WEIGHTS[feedbackType] * (value / 100))
    const rawScore = sum(weightedScores)

    return rawScore / PERFECT_SCORE
  }

  getFeedback({respondentId, subjectId}) {
    return getUserFeedback(this.pool, {respondentId, subjectId})
  }
}
