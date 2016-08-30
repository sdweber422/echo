/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import teamSizesMatchRecommendation from '../teamSizesMatchRecommendation'

describe(testContext(__filename), function () {
  context('when teams are complete', function () {
    it('returns the percentage of teams matching recommendation', function () {
      const pool = {
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
        ],
      }
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', teamSize: 3, playerIds: ['A1', 'p1', 'p2']},
          {goalDescriptor: 'g2', teamSize: 2, playerIds: ['A1', 'p3']},
        ]
      }

      const score = teamSizesMatchRecommendation(pool, teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
  })
  context('when teams are NOT complete', function () {
    it('returns the percentage of teams planned to match recommendation', function () {
      const pool = {
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
        ],
      }
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', teamSize: 3, playerIds: []},
          {goalDescriptor: 'g2', teamSize: 2, playerIds: []},
        ]
      }

      const score = teamSizesMatchRecommendation(pool, teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
  })
})
