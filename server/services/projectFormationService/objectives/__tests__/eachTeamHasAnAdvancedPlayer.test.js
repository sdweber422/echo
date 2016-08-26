/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import advancedPlayersProjectsAllHaveSameGoal from '../advancedPlayersProjectsAllHaveSameGoal'

describe(testContext(__filename), function () {
  it('returns the percentage of advanced players with only one goal', function () {
    const pool = {
      advancedPlayers: ['A1', 'A2']
    }
    const teams = [
      {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
      {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
      {goalDescriptor: 'g3', playerIds: ['A2', 'p5', 'p6']},
    ]

    const score = advancedPlayersProjectsAllHaveSameGoal(pool, teams)

    expect(score).to.eq(1 / 2)
  })
  context('teams are not complete', function () {
    it('returns the percentage of advanced players who could end up with just one goal', function () {
      const pool = {
        advancedPlayers: ['A1', 'A2']
      }
      const teams = [
        {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
        {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
      ]

      const score = advancedPlayersProjectsAllHaveSameGoal(pool, teams, {teamsAreIncomplete: true})

      expect(score).to.eq(1 / 2)
    })
  })
})
