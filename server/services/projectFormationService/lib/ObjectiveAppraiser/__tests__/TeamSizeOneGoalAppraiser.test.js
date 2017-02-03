/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import TeamSizeOneGoalAppraiser from '../TeamSizeOneGoalAppraiser'
import {
  buildTestPool,
  buildTestTeamFormationPlan,
} from '../../../__tests__/helpers'

describe(testContext(__filename), function () {
  const pool = buildTestPool({playerCount: 2, goalCount: 2, teamSizes: [1, 2]})
  context('when teams are complete', function () {
    it('Test to see how many players got team size 1 vote', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 1, players: ['p0']},
        {teamSize: 1, players: ['p1']}
      ], pool)

      console.log('team formation ====>', teamFormationPlan)
      teamFormationPlan.teams.forEach(team => console.log('Players ids ====>', team.playerIds))
      pool.votes.forEach(player => console.log('Goal Votes ======>', player.playerId, player.votes))

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })

    it('Test to see how many players got team size 1 vote', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {teamSize: 2, players: ['p0', 'p1']}
      ], pool)

      console.log('team formation 2.0.1====>', teamFormationPlan)
      teamFormationPlan.teams.forEach(team => console.log('Players ids ====>', team.playerIds))
      pool.votes.forEach(player => console.log('Goal Votes ======>', player.playerId, player.votes))

      const appraiser = new TeamSizeOneGoalAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0)
    })
  })

  // context('when teams are complete', function () {
  //   it('Test to see how many players got their vote for team size 1', function () {
  //     const teamFormationPlan = buildTestTeamFormationPlan([
  //       {teamSize: 3, players: ['p0', 'p1', 'p2']},
  //       {teamSize: 2, players: ['p3', 'p4']},
  //       {teamSize: 1, players: ['p5']},
  //       {teamSize: 1, players: ['p6']}
  //     ], pool)
  //
  //     console.log('team formation ====>', teamFormationPlan)
  //     teamFormationPlan.teams.forEach(team => console.log('Players ids ====>', team.playerIds))
  //     pool.votes.forEach(player => console.log('Goal Votes ======>', player.playerId, player.votes))
  //
  //     const appraiser = new TeamSizeOneGoalAppraiser(pool)
  //     const score = appraiser.score(teamFormationPlan)
  //
  //     expect(score).to.eq(1 / 2)
  //   })
  // })
})
