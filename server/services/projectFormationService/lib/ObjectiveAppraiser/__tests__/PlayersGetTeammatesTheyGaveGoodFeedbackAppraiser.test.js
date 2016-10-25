/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser, {
  NOVELTY_WEIGHT,
  PERFECT_SCORE
} from '../PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser'

describe(testContext(__filename), function () {
  const bestScoreForRepeatTeammate = (PERFECT_SCORE - NOVELTY_WEIGHT) / PERFECT_SCORE
  const poolDefaults = {
    votes: [
      {playerId: 'A0', votes: ['g1', 'g2']},
      {playerId: 'A1', votes: ['g1', 'g2']},
      {playerId: 'p0', votes: ['g1', 'g2']},
      {playerId: 'p1', votes: ['g1', 'g2']},
    ],
    goals: [
      {goalDescriptor: 'g1', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 4},
    ],
    advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
  }

  context('when the teams are complete', function () {
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', playerIds: ['A0', 'p0']},
        {goalDescriptor: 'g3', playerIds: ['A1', 'p1']},
      ]
    };

    ([0, 0.5, 1]).forEach(v => {
      it(`returns ${v} when everyone rated all their teammates ${v}`, function () {
        const stats = {CULTURE_CONTRIBUTION: v, TEAM_PLAY: v, TECHNICAL_HEALTH: v}
        const playerFeedback = {
          respondentIds: {
            A0: {subjectIds: {A1: stats, p0: stats, p1: stats}},
            A1: {subjectIds: {A0: stats, p0: stats, p1: stats}},
            p0: {subjectIds: {A0: stats, A1: stats, p1: stats}},
            p1: {subjectIds: {A0: stats, A1: stats, p0: stats}},
          }
        }
        const pool = {...poolDefaults, playerFeedback}

        const appraiser = new PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
        const score = appraiser.score(teamFormationPlan)

        expect(score).to.eq(v * bestScoreForRepeatTeammate)
      })
    })

    it('weights each player correctly', function () {
      const perfectScore = {CULTURE_CONTRIBUTION: 1.0, TEAM_PLAY: 1.0, TECHNICAL_HEALTH: 1.0}
      const halfScore = {CULTURE_CONTRIBUTION: 0.5, TEAM_PLAY: 0.5, TECHNICAL_HEALTH: 0.5}
      const playerFeedback = {
        respondentIds: {
          A0: {
            subjectIds: {
              A1: perfectScore,
              p0: halfScore,
              p1: perfectScore,
            },
          },
          A1: {subjectIds: {A0: perfectScore, p0: perfectScore, p1: perfectScore}},
          p0: {subjectIds: {A0: perfectScore, A1: perfectScore, p1: perfectScore}},
          p1: {subjectIds: {A0: perfectScore, A1: perfectScore, p0: perfectScore}},
        }
      }
      const pool = {...poolDefaults, playerFeedback}

      const appraiser = new PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)
      const expectedScore = 0.75 * bestScoreForRepeatTeammate + // 3 players are perfectly happy
                            0.125 * bestScoreForRepeatTeammate // 1 player is 50% happy
      expect(score).to
        .be.gt(expectedScore - 0.000001)
        .and.lt(expectedScore + 0.000001)
    })
  })

  context('when the teams are not complete', function () {
    it('assumes unassigned players will all get perfect teammates', function () {
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', playerIds: ['A0', 'p0']},
          {goalDescriptor: 'g3', playerIds: []},
        ]
      }
      const playerFeedback = {
        respondentIds: {
          A0: {subjectIds: {A1: 0, p0: 1, p1: 0}},
          A1: {subjectIds: {A0: 0, p0: 0, p1: 0}},
          p0: {subjectIds: {A0: 1, A1: 0, p1: 0}},
          p1: {subjectIds: {A0: 0, A1: 0, p0: 0}},
        }
      }
      const pool = {...poolDefaults, playerFeedback}
      const appraiser = new PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })

    it('assumes players without teammates yet will all get perfect teammates', function () {
      const teamFormationPlan = {
        teams: [
          {goalDescriptor: 'g1', playerIds: ['A0', 'p0']},
          {goalDescriptor: 'g3', playerIds: ['A1']},
        ]
      }
      const playerFeedback = {
        respondentIds: {
          A0: {subjectIds: {A1: 0, p0: 1, p1: 0}},
          A1: {subjectIds: {A0: 0, p0: 0, p1: 0}},
          p0: {subjectIds: {A0: 1, A1: 0, p1: 0}},
          p1: {subjectIds: {A0: 0, A1: 0, p0: 0}},
        }
      }
      const pool = {...poolDefaults, playerFeedback}
      const appraiser = new PlayersGetTeammatesTheyGaveGoodFeedbackAppraiser(pool)
      const score = appraiser.score(teamFormationPlan)

      expect(score).to.eq(0.5)
    })
  })
})
