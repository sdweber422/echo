/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import playersGotTheirVote, {
  SECOND_CHOICE_VALUE,
} from '../playersGotTheirVote'

describe(testContext(__filename), function () {
  const REGULAR_PLAYER_1ST_CHOICE = 'g1'
  const REGULAR_PLAYER_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_1 = 'A1'
  const ADVANCED_PLAYER_2 = 'A2'
  const ADVANCED_PLAYER_1_1ST_CHOICE = 'g1'
  const ADVANCED_PLAYER_1_2ND_CHOICE = 'g2'
  const ADVANCED_PLAYER_2_1ST_CHOICE = 'g3'
  const ADVANCED_PLAYER_2_2ND_CHOICE = 'g2'
  const pool = {
    votes: [
      {playerId: ADVANCED_PLAYER_1, votes: [ADVANCED_PLAYER_1_1ST_CHOICE, ADVANCED_PLAYER_1_2ND_CHOICE]},
      {playerId: ADVANCED_PLAYER_2, votes: [ADVANCED_PLAYER_2_1ST_CHOICE, ADVANCED_PLAYER_2_2ND_CHOICE]},
      {playerId: 'p1', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p2', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p3', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p4', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p5', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p6', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p7', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
      {playerId: 'p8', votes: [REGULAR_PLAYER_1ST_CHOICE, REGULAR_PLAYER_2ND_CHOICE]},
    ],
    goals: [
      {goalDescriptor: REGULAR_PLAYER_1ST_CHOICE, teamSize: 4},
      {goalDescriptor: REGULAR_PLAYER_2ND_CHOICE, teamSize: 4},
      {goalDescriptor: 'g3', teamSize: 4},
      {goalDescriptor: 'g4', teamSize: 4},
    ],
    advancedPlayers: [ADVANCED_PLAYER_1, ADVANCED_PLAYER_2],
  }

  describe('with complete teams', function () {
    context('regularPlayersOnly', function () {
      it('returns the percentage of players who got their first vote', function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
            {
              goalDescriptor: 'g3',
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {regularPlayersOnly: true})

        expect(score).to.eq(1 / 2)
      })

      it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
            {
              goalDescriptor: 'g3',
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {regularPlayersOnly: true})
        expect(score).to.eq(0.35)
      })
    })

    context('advancedPlayersOnly', function () {
      it('returns the percentage of advanced players who got their first vote', function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: ADVANCED_PLAYER_1_1ST_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
            {
              goalDescriptor: 'g3',
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

        expect(score).to.eq(1)
      })

      it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
            {
              goalDescriptor: 'g4',
              playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

        expect(score).to.eq(0.35)
      })
    })

    it('does not score players who got their vote and are on two teams twice', function () {
      const teamFormationPlan = {
        teams: [
          {
            goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2'],
          },
          {
            goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
            playerIds: [ADVANCED_PLAYER_1, 'p3', 'p4'],
          },
          {
            goalDescriptor: 'g4',
            playerIds: [ADVANCED_PLAYER_2, 'p5', 'p6', 'p7', 'p8'],
          },
        ]
      }

      const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

      expect(score).to.eq(0.35)
    })
  })

  describe('with incomplete teams', function () {
    context('regularPlayersOnly', function () {
      it('returns the percentage of players who can get their first vote', function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: REGULAR_PLAYER_1ST_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {regularPlayersOnly: true})

        expect(score).to.eq(1)
      })

      it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: REGULAR_PLAYER_2ND_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {regularPlayersOnly: true})
        expect(score).to.eq(0.85)
      })
    })

    context('advancedPlayersOnly', function () {
      it('returns the percentage of advanced players who can get their first vote', function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: ADVANCED_PLAYER_1_1ST_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2', 'p3', 'p4'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

        expect(score).to.eq(1)
      })

      it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
        const teamFormationPlan = {
          teams: [
            {
              goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
              playerIds: [ADVANCED_PLAYER_1, 'p5', 'p6', 'p7', 'p8'],
            },
          ]
        }

        const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

        expect(score).to.eq(0.85)
      })
    })

    it('does not score players who got their vote and are on two teams twice', function () {
      const teamFormationPlan = {
        teams: [
          {
            goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
            playerIds: [ADVANCED_PLAYER_1, 'p1', 'p2'],
          },
          {
            goalDescriptor: ADVANCED_PLAYER_1_2ND_CHOICE,
            playerIds: [ADVANCED_PLAYER_1, 'p3', 'p4'],
          },
        ]
      }

      const score = playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})

      expect(score).to.eq(0.85)
    })
  })
})
