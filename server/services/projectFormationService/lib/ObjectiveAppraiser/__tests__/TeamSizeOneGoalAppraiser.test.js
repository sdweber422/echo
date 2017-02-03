/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import TeamSizeOneGoalAppraiser from '../TeamSizeOneGoalAppraiser'
import {
  buildTestPool,
  buildTestTeamFormationPlan,
} from '../../../__tests__/helpers'

describe(testContext(__filename), function () {
  const pool = buildTestPool({playerCount: 6, goalCount: 3, teamSizes: [1, 2, 2]})
  context('when teams are complete', function () {
    it('returns 1/2 when there were two groups of both one and two', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1']},
        {teamSize: 2, players: ['p2', 'p3']},
        {teamSize: 1, players: ['p4']},
        {teamSize: 1, players: ['p5']}
      ], pool)
      console.log('pool', pool, pool.votes)
      console.log('teamFormationPlan', teamFormationPlan)

      console.log('team formation ====>', teamFormationPlan)
      teamFormationPlan.teams.forEach(team => console.log('Players ids ====>', team.playerIds))
      pool.votes.forEach(player => console.log('Goal Votes ======>', player.playerId, player.votes))

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1 / 2)
    })
  })

  context('when teams are complete', function () {
    it('returns 4/5 when there was 0ne group of 2 and the rest were projects of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1']},
        {teamSize: 1, players: ['p2']},
        {teamSize: 1, players: ['p3']},
        {teamSize: 1, players: ['p4']},
        {teamSize: 1, players: ['p5']}
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(4 / 5)
    })
  })

  context('when teams are complete', function () {
    it('returns 1 when all players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 1, players: ['p0']},
        {teamSize: 1, players: ['p1']},
        {teamSize: 1, players: ['p2']},
        {teamSize: 1, players: ['p3']},
        {teamSize: 1, players: ['p4']},
        {teamSize: 1, players: ['p5']}
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })
  })

  context('when teams are complete', function () {
    it('returns 0 when no players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1']},
        {teamSize: 2, players: ['p2', 'p3']},
        {teamSize: 2, players: ['p4', 'p5']},
      ], pool)

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0)
    })
  })
})
