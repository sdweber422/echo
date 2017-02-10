/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import OnePlayerGoalVotesSatisfiedAppraiser from '../OnePlayerGoalVotesSatisfiedAppraiser'
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
      expectScore(1, {pool, teamFormationPlan})
    })

    it('returns 1 / 2 when there was a group of 2 and a group of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 3, players: ['p1', 'p2', 'p3']},
      ], pool)
      expectScore(1 / 2, {pool, teamFormationPlan})
    })

    it('returns 0 when no players got team size of 1', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g1', teamSize: 2, players: ['p0', 'p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      expectScore(0, {pool, teamFormationPlan})
    })

    it('if two people voted for a goal of team size one and get put on that goal together', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0', 'p1']},
        {goal: 'g1', teamSize: 2, players: ['p2', 'p3']},
      ], pool)
      expectScore(1, {pool, teamFormationPlan})
    })

    it('if four players voted for team size one goal and 3 get it.', function () {
      const pool = buildTestPool({
        playerCount: 8,
        goalCount: 4,
        teamSizes: [1, 2],
        voteDistributionPercentages: [0.50, 0.50]
      })
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 2, players: ['p1', 'p2']},
        {goal: 'g1', teamSize: 2, players: ['p3', 'p4']},
        {goal: 'g1', teamSize: 3, players: ['p5', 'p6', 'p7']},
      ], pool)
      expectScore(0.25, {pool, teamFormationPlan})
    })

    it('only counts team size one projects that match the players vote', function () {
      const pool = buildTestPool({
        playerCount: 3,
        goalCount: 2,
        teamSizes: [1, 1],
        voteDistributionPercentages: [1, 0]
      })
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 1, players: ['p1']},
        {goal: 'g1', teamSize: 1, players: ['p2']}
      ], pool)
      expectScore(1 / 3, {pool, teamFormationPlan})
    })

    it('only counts team size one projects that match the players vote, one player got their vote', function () {
      const pool = buildTestPool({
        playerCount: 3,
        goalCount: 2,
        teamSizes: [1, 1],
        voteDistributionPercentages: [1, 0]
      })
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: ['p0']},
        {goal: 'g1', teamSize: 1, players: ['p1']},
        {goal: 'g1', teamSize: 1, players: ['p2']}
      ], pool)
      expectScore(1 / 3, {pool, teamFormationPlan})
    })
  })

  context('when teams are incomplete', () => {
    const pool = buildTestPool({
      playerCount: 5,
      goalCount: 3,
      teamSizes: [1, 2, 2],
      voteDistributionPercentages: [0.80, 0.20]
    })

    it('returns 1 even when no players assigned in the formation', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', teamSize: 1, players: []},
        {goal: 'g0', teamSize: 1, players: []},
      ], pool)
      expectScore(1, {pool, teamFormationPlan, teamsAreIncomplete: true})
    })

    it('returns the score for the best possible scenario when goal selection is not complete', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g1', teamSize: 2, players: ['p0', 'p4']},
        {goal: 'g0', teamSize: 1, players: ['p1']},
        {goal: 'g0', teamSize: 1, players: []},
      ], pool)
      expectScore(0.75, {pool, teamFormationPlan, teamsAreIncomplete: true})
    })

    it('returns the score for the best possible scenario when goal selection is not complete', function () {
      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g1', teamSize: 2, players: []}
      ], pool)
      expectScore(0.75, {pool, teamFormationPlan, teamsAreIncomplete: true})
    })
  })
})

function expectScore(expectedScore, {pool, teamFormationPlan, teamsAreIncomplete = false}) {
  const appraiser = new OnePlayerGoalVotesSatisfiedAppraiser(pool)
  const score = appraiser.score(teamFormationPlan, {teamsAreIncomplete})

  expect(
    score,
    `${teamFormationPlanToString(teamFormationPlan)} should get a score of ${expectedScore}`
  ).to.eq(expectedScore)
}

