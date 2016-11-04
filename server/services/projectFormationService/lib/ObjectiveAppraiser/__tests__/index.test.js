/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {buildTestPool, buildTestTeamFormationPlan} from '../../../__tests__/helpers'
import ObjectiveAppraiser from '../index'

describe(testContext(__filename), function () {
  describe('.score()', function () {
    // NOTE: Most edge cases should be tested in the individual objective module's tests
    it('integration test', function () {
      const pool = {
        votes: [
          {playerId: 'p0', votes: ['g1', 'g2']},
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'p2', votes: ['g1', 'g2']},
          {playerId: 'p3', votes: ['g1', 'g1']},
          {playerId: 'p4', votes: ['g2', 'g2']},
          {playerId: 'p5', votes: ['g2', 'g1']},
          {playerId: 'p6', votes: ['g2', 'g1']},
          {playerId: 'p7', votes: ['g2', 'g1']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 4},
          {goalDescriptor: 'g2', teamSize: 4},
        ],
      }

      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g1', players: ['p0', 'p1', 'p2', 'p3']},
        {goal: 'g2', players: ['p4', 'p5', 'p6', 'p7']},
      ], pool)

      const appraiser = new ObjectiveAppraiser(pool)
      const result = appraiser.score(teamFormationPlan)
      expect(result).to.eq(1)
    })

    context('when the objectives are specified in the pool', function () {
      const pool = buildTestPool({
        playerCount: 6,
        goalCount: 3,
        teamSize: 3,
        voteDistributionPercentages: [1],
      })

      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', players: ['p0', 'p1', 'p2']},
        {goal: 'g2', players: ['p3', 'p4', 'p5']},
      ], pool)
      const percentagePlayersGotTheirVote = 0.5
      const percentagePlayersWithNewTemmates = 1.0

      const scoreWithPool = pool => {
        const appraiser = new ObjectiveAppraiser(pool)
        return appraiser.score(teamFormationPlan)
      }

      it('returns a perfect score if there are no weighted objectives', function () {
        const poolWithNoWeightedObjectives = {...pool, objectives: {weighted: []}}
        expect(scoreWithPool(poolWithNoWeightedObjectives)).to.eq(1)
      })

      it('uses the weights', function () {
        const poolWithObjectives = ({voteWeight, feedbackWeight}) => ({
          ...pool,
          objectives: {
            mandatory: [],
            weighted: [
              ['PlayersGotTheirVote', voteWeight],
              ['PlayersGetTeammatesTheyGaveGoodFeedback', feedbackWeight],
            ],
          }
        })

        const itReturnsTheCorrectScore = ({voteWeight, feedbackWeight}) => {
          const pool = poolWithObjectives({voteWeight, feedbackWeight})
          const sumOfWeights = voteWeight + feedbackWeight
          expect(scoreWithPool(pool)).to.eq(
            (
              percentagePlayersWithNewTemmates * feedbackWeight +
              percentagePlayersGotTheirVote * voteWeight
            ) / sumOfWeights
          )
        }

        [
          {voteWeight: 1, feedbackWeight: 2},
          {voteWeight: 1, feedbackWeight: 1},
          {voteWeight: 100, feedbackWeight: 1},
        ].forEach(({voteWeight, feedbackWeight}) => {
          itReturnsTheCorrectScore({voteWeight, feedbackWeight})
        })
      })
    })
  })

  describe('.objectiveScores()', function () {
    it('returns the individual scored for each objective', function () {
      const pool = buildTestPool({
        playerCount: 8,
        goalCount: 2,
        teamSize: 3,
        voteDistributionPercentages: [0.3, 0.7],
      })

      const teamFormationPlan = buildTestTeamFormationPlan([
        {goal: 'g0', players: ['p0', 'p1', 'p2']},
        {goal: 'g0', players: ['p3', 'p4', 'p5']},
      ], pool)

      const appraiser = new ObjectiveAppraiser(pool)
      const objectiveScores = appraiser.objectiveScores(teamFormationPlan)
      objectiveScores.forEach(({score}) => {
        expect(score).to.be.at.least(0).and.at.most(1)
      })
    })
  })
})
