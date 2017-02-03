/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import TeamSizeOneGoalAppraiser from '../TeamSizeOneGoalAppraiser'
import {
  buildTestPool,
  buildTestTeamFormationPlan,
} from '../../../__tests__/helpers'
import {teamFormationPlanToString} from '../../teamFormationPlan'

describe(testContext(__filename), function () {
  const pool = buildTestPool({
    playerCount: 4,
    goalCount: 2,
    teamSizes: [1, 2],
    voteDistributionPercentages: [0.5, 0.5]
  })

  context('when teams are complete', function () {
    it.only('returns 1 when there were two groups of both one and two', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g0', teamSize: 1, players: ['p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      console.log(teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
    it('returns 3/4 when there was 0ne group of 2 and the rest were projects of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1', 'p2']},
        {teamSize: 1, players: ['p3']},
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
    it('returns 1 when all players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 1, players: ['p0']},
        {teamSize: 1, players: ['p1']},
        {teamSize: 1, players: ['p2']},
        {teamSize: 1, players: ['p3']}
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
    it('returns 0 when no players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1']},
        {teamSize: 2, players: ['p2', 'p3']},
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0)
    })
  })
})
