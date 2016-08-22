/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import playersGotTheirVote, {
  SECOND_CHOICE_VALUE,
} from '../playersGotTheirVote'

describe(testContext(__filename), function () {
  const pool = {
    votes: [
      {playerId: 'p0', votes: ['g1', 'g2']},
      {playerId: 'p1', votes: ['g1', 'g2']},
      {playerId: 'p2', votes: ['g1', 'g2']},
      {playerId: 'p3', votes: ['g1', 'g2']},
      {playerId: 'p4', votes: ['g1', 'g2']},
      {playerId: 'p5', votes: ['g3', 'g2']},
      {playerId: 'p6', votes: ['g1', 'g2']},
      {playerId: 'p7', votes: ['g1', 'g2']},
      {playerId: 'p8', votes: ['g1', 'g2']},
      {playerId: 'p9', votes: ['g1', 'g2']},
    ],
    goals: [
      {goalDescriptor: 'g1', teamSize: 4},
      {goalDescriptor: 'g2', teamSize: 4},
      {goalDescriptor: 'g3', teamSize: 4},
      {goalDescriptor: 'g4', teamSize: 4},
    ],
    advancedPlayers: ['p0', 'p5'],
  }

  context('regularPlayersOnly', function () {
    it('returns the percentage of players who got their first vote', function () {
      const teams = [
        {
          goalDescriptor: 'g1',
          playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
        },
        {
          goalDescriptor: 'g3',
          playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
        },
      ]

      const score = playersGotTheirVote(pool, teams, {regularPlayersOnly: true})

      expect(score).to.eq(1 / 2)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teams = [
        {
          goalDescriptor: 'g2',
          playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
        },
        {
          goalDescriptor: 'g3',
          playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
        },
      ]

      const score = playersGotTheirVote(pool, teams, {regularPlayersOnly: true})
      expect(score).to.eq(0.35)
    })
  })

  context('advancedPlayersOnly', function () {
    it('returns the percentage of advanced players who got their first vote', function () {
      const teams = [
        {
          goalDescriptor: 'g1',
          playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
        },
        {
          goalDescriptor: 'g3',
          playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
        },
      ]

      const score = playersGotTheirVote(pool, teams, {advancedPlayersOnly: true})

      expect(score).to.eq(1)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teams = [
        {
          goalDescriptor: 'g2',
          playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
        },
        {
          goalDescriptor: 'g4',
          playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
        },
      ]

      const score = playersGotTheirVote(pool, teams, {advancedPlayersOnly: true})

      expect(score).to.eq(0.35)
    })
  })

  it('does not score players who got their vote and are on two teams twice', function () {
    const teams = [
      {
        goalDescriptor: 'g2',
        playerIds: ['p0', 'p1', 'p2'],
      },
      {
        goalDescriptor: 'g2',
        playerIds: ['p0', 'p3', 'p4'],
      },
      {
        goalDescriptor: 'g4',
        playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
      },
    ]

    const score = playersGotTheirVote(pool, teams, {advancedPlayersOnly: true})

    expect(score).to.eq(0.35)
  })
})
