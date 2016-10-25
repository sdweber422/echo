/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {buildTestPool} from '../../../__tests__/helpers'
import ObjectiveAppraiser from '../index'

describe(testContext(__filename), function () {
  describe('.score()', function () {
    // NOTE: Most edge cases should be tested in the individual objective module's tests
    it('integration test', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g1', 'g2']},
          {playerId: 'p0', votes: ['g1', 'g2']},
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'A1', votes: ['g2', 'g1']},
          {playerId: 'p2', votes: ['g2', 'g2']},
          {playerId: 'p3', votes: ['g2', 'g1']},
          {playerId: 'p4', votes: ['g2', 'g1']},
          {playerId: 'p5', votes: ['g2', 'g1']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
        ],
        advancedPlayers: [{id: 'A0', maxTeams: 2}, {id: 'A1', maxTeams: 1}],
      }
      const teamFormationPlan = {
        seatCount: 9,
        teams: [
          {
            goalDescriptor: 'g1',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A0', 'p0', 'p1']
          },
          {
            goalDescriptor: 'g1',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A0', 'p3', 'p4']
          },
          {
            goalDescriptor: 'g2',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A1', 'p2', 'p5']
          },
        ],
      }

      const appraiser = new ObjectiveAppraiser(pool)
      const result = appraiser.score(teamFormationPlan)
      expect(result).to.eq(1)
    })

    context('when the objectives are specified in the pool', function () {
      const pool = buildTestPool({
        playerCount: 4,
        advancedPlayerCount: 2,
        goalCount: 3,
        teamSize: 3,
        voteDistributionPercentages: [1],
      })

      const teamFormationPlan = {
        seatCount: 6,
        teams: [
          {goalDescriptor: 'g0', teamSize: 2, playerIds: ['A0', 'p0']},
          {goalDescriptor: 'g2', teamSize: 4, playerIds: ['A1', 'p1', 'p2', 'p3']},
        ],
      }

      const percentageAdvancedPlayersGotTheirVote = 1 / 2
      const percentageNonAdvancedPlayersGotTheirVote = 1 / 4

      const scoreWithPool = pool => {
        const appraiser = new ObjectiveAppraiser(pool)
        return appraiser.score(teamFormationPlan)
      }

      it('returns a perfect score if there are no weighted objectives', function () {
        const poolWithNoWeightedObjectives = {...pool, objectives: {weighted: []}}
        expect(scoreWithPool(poolWithNoWeightedObjectives)).to.eq(1)
      })

      it('uses the weights', function () {
        const poolWithObjectives = ({advancedWeight, nonAdvancedWeight}) => ({
          ...pool,
          objectives: {
            mandatory: [],
            weighted: [
              ['NonAdvancedPlayersGotTheirVote', nonAdvancedWeight],
              ['AdvancedPlayersGotTheirVote', advancedWeight],
            ],
          }
        })

        const itReturnsTheCorrectScore = ({advancedWeight, nonAdvancedWeight}) => {
          const pool = poolWithObjectives({advancedWeight, nonAdvancedWeight})
          const sumOfWeights = advancedWeight + nonAdvancedWeight
          expect(scoreWithPool(pool)).to.eq(
            (
              percentageNonAdvancedPlayersGotTheirVote * nonAdvancedWeight +
              percentageAdvancedPlayersGotTheirVote * advancedWeight
            ) / sumOfWeights
          )
        }

        [
          {advancedWeight: 1, nonAdvancedWeight: 2},
          {advancedWeight: 1, nonAdvancedWeight: 1},
          {advancedWeight: 100, nonAdvancedWeight: 1},
        ].forEach(({advancedWeight, nonAdvancedWeight}) => {
          itReturnsTheCorrectScore({advancedWeight, nonAdvancedWeight})
        })
      })
    })
  })

  describe('.objectiveScores()', function () {
    it('returns the individual scored for each objective', function () {
      const pool = buildTestPool({
        playerCount: 6,
        advancedPlayerCount: 2,
        goalCount: 2,
        teamSize: 3,
        voteDistributionPercentages: [0.3, 0.7],
      })

      const teamFormationPlan = {
        seatCount: 9,
        teams: [
          {
            goalDescriptor: 'g0',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A0', 'p0', 'p1']
          },
          {
            goalDescriptor: 'g0',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A0', 'p3', 'p4']
          },
          {
            goalDescriptor: 'g1',
            teamSize: 3,
            matchesTeamSizeRecommendation: true,
            playerIds: ['A1', 'p2', 'p5']
          },
        ],
      }

      const appraiser = new ObjectiveAppraiser(pool)
      const objectiveScores = appraiser.objectiveScores(teamFormationPlan)
      objectiveScores.forEach(({score}) => {
        expect(score).to.be.at.least(0).and.at.most(1)
      })
    })
  })
})
