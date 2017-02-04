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
    it('returns 1 when there were two groups of both one and two', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g0', teamSize: 1, players: ['p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      console.log('Test 1 returns a score of 1', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
    it('returns 1 / 2 when there was a group of 2 and a group of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 2, players: ['p1', 'p2']},
      ], pool)
      console.log('Testing for 50%', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
    it('returns 1 when all players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g0', teamSize: 1, players: ['p1']},
        {goal: 'g0', teamSize: 1, players: ['p2']},
        {goal: 'g0', teamSize: 1, players: ['p3']}
      ], pool)
      console.log('Testing for 1', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
    it('returns 0 when no players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g1', teamSize: 2, players: ['p0', 'p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      console.log('Testing for 0', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0)
    })
    it('returns 1 even when no players assigned in the formation', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: []},
        {goal: 'g0', teamSize: 1, players: []},
      ], pool)
      console.log('Test 5 returns 1', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
    it('if two people voted for a goal of team size one and get put on that goal together', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0', 'p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      console.log('Test 6 returns 0.5', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
    it('if four players voted for team size one goal and 3 get it.', function () {
      const pool = buildTestPool({
        playerCount: 8,
        goalCount: 4,
        teamSizes: [1, 1, 2, 2],
        voteDistributionPercentages: [0.50, 0, 0.50, 0]
      })

      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 1, players: ['p1', 'p2']},
        {goal: 'g2', teamSize: 2, players: ['p3', 'p4']},
        {goal: 'g3', teamSize: 2, players: ['p5', 'p6', 'p7']},
      ], pool)
      console.log('Test 7 returns 0.75', teamFormationPlanToString(teamFormationPlan))
      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / (5 / 2))
    })
  })
})
