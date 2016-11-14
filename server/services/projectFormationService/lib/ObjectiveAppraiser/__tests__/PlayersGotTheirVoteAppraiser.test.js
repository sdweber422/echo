/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import PlayersGotTheirVoteAppraiser from '../PlayersGotTheirVoteAppraiser'

const SECOND_CHOICE_VALUE = PlayersGotTheirVoteAppraiser.SECOND_CHOICE_VALUE

describe(testContext(__filename), function () {
  const PLAYER_1ST_CHOICE = 'g1'
  const PLAYER_2ND_CHOICE = 'g2'
  const GOAL_WITH_NO_VOTES = 'g3'
  const pool = {
    votes: [
      {playerId: 'p0', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p1', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p2', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p3', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p4', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p5', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p6', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p7', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p8', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
      {playerId: 'p9', votes: [PLAYER_1ST_CHOICE, PLAYER_2ND_CHOICE]},
    ],
    goals: [
      {goalDescriptor: PLAYER_1ST_CHOICE, teamSize: 4},
      {goalDescriptor: PLAYER_2ND_CHOICE, teamSize: 4},
      {goalDescriptor: GOAL_WITH_NO_VOTES, teamSize: 4},
    ],
  }

  describe('with complete teams', function () {
    it('returns the percentage of players who got their first vote', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(1 / 2)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: ['p5', 'p6', 'p7', 'p8', 'p9'],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(SECOND_CHOICE_VALUE / 2)
    })
  })

  describe('with incomplete teams', function () {
    it('correctly handles teamFormationPlans without all of the goals selected', function () {
      const pool = {
        votes: [
          {playerId: 'p0', votes: ['g0', 'g1']},
          {playerId: 'p1', votes: ['g1', 'g0']},
          {playerId: 'p2', votes: ['g0', 'g1']},
          {playerId: 'p3', votes: ['g1', 'g0']},
          {playerId: 'p4', votes: ['g0', 'g1']},
          {playerId: 'p5', votes: ['g1', 'g0']},
          {playerId: 'p6', votes: ['g0', 'g1']},
          {playerId: 'p7', votes: ['g1', 'g0']},
        ],
        goals: [
          {goalDescriptor: 'g0', teamSize: 3},
          {goalDescriptor: 'g1', teamSize: 3},
        ],
      }
      const teamFormationPlan = {
        seatCount: 9,
        teams: [
          {
            goalDescriptor: 'g0',
            teamSize: 3,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(1)
    })

    it('works when no players have been assigned at all', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it('returns the percentage of players who can get their vote', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it(`gives getting your second vote ${SECOND_CHOICE_VALUE * 100}% of the value of getting your first`, function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(
        // half already have their first choice
        0.5 +
        // everyone else can get their 2nd choice
        (SECOND_CHOICE_VALUE / 2)
      )
    })

    it('considers unassigned players votes and what goals have already been chosen', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_1ST_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: GOAL_WITH_NO_VOTES,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(0.5)
    })

    it('considers unassigned players votes and what goals have already been chosen 2', function () {
      const teamFormationPlan = {
        seatCount: 10,
        teams: [
          {
            goalDescriptor: PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: ['p0', 'p1', 'p2', 'p3', 'p4'],
          },
          {
            goalDescriptor: PLAYER_2ND_CHOICE,
            teamSize: 5,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(SECOND_CHOICE_VALUE)
    })

    it('takes into consideration that if a goal has been chosen some players MUST fill those seats', function () {
      const pool = {
        votes: [
          {playerId: 'p0', votes: ['g0', 'g3']},
          {playerId: 'p1', votes: ['g0', 'g3']},
          {playerId: 'p2', votes: ['g2', 'g3']},
          {playerId: 'p3', votes: ['g2', 'g3']},
          {playerId: 'p4', votes: ['g2', 'g3']},
          {playerId: 'p5', votes: ['g2', 'g3']},
          {playerId: 'p6', votes: ['g2', 'g3']},
          {playerId: 'p7', votes: ['g2', 'g3']},
        ],
        goals: [
          {goalDescriptor: 'g0', teamSize: 3},
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
          {goalDescriptor: 'g3', teamSize: 3},
        ],
      }
      const teamFormationPlan = {
        seatCount: 8,
        teams: [
          {
            goalDescriptor: 'g0',
            teamSize: 4,
            playerIds: [],
          },
        ]
      }

      const appriaser = new PlayersGotTheirVoteAppraiser(pool)
      const score = appriaser.score(teamFormationPlan)
      expect(score).to.eq(6 / 8)
    })
  })
})
