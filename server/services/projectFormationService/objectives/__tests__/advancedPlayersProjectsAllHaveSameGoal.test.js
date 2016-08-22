/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import eachTeamHasAnAdvancedPlayer from '../eachTeamHasAnAdvancedPlayer'

describe(testContext(__filename), function () {
  it('returns the percentage of teams with advanced players', function () {
    const pool = {
      advancedPlayers: ['A1', 'A2']
    }
    const teams = [
      {
        goalDescriptor: 'g1',
        playerIds: ['A1', 'p1', 'p2'],
      },
      {
        goalDescriptor: 'g1',
        playerIds: ['p3', 'p4', 'p5'],
      },
    ]

    const score = eachTeamHasAnAdvancedPlayer(pool, teams)

    expect(score).to.eq(1 / 2)
  })
})
