/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {buildTestPool} from 'src/server/services/projectFormationService/__tests__/util'
import {teamFormationPlanToString} from 'src/server/services/projectFormationService/teamFormationPlan'

import ennumerateGoalChoices from '../ennumerateGoalChoices'

describe(testContext(__filename), function () {
  describe('ennumerateGoalChoices()', function () {
    it('returns perfect fits first', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g1', 'g2']},
          {playerId: 'A1', votes: ['g1', 'g2']},
          {playerId: 'p0', votes: ['g1', 'g2']},
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'p2', votes: ['g1', 'g2']},
          {playerId: 'p3', votes: ['g1', 'g2']},
          {playerId: 'p4', votes: ['g1', 'g2']},
          {playerId: 'p5', votes: ['g1', 'g2']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
          {goalDescriptor: 'g3', teamSize: 3},
        ],
        advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
      }

      const results = [...ennumerateGoalChoices(pool)]

      const expectedFirstResults = [
        '(g1:3)[], (g1:3)[], (g1:3)[]',
        '(g1:3)[], (g1:3)[], (g2:3)[]',
        '(g1:3)[], (g2:3)[], (g2:3)[]',
        '(g2:3)[], (g2:3)[], (g2:3)[]',
      ]
      const firstResults = results.slice(0, expectedFirstResults.length)

      expect(firstResults.map(teamFormationPlanToString).sort()).to.deep.eq(expectedFirstResults.sort())
    })

    it('accepts a pruning function', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g1', 'g2']},
          {playerId: 'A1', votes: ['g1', 'g2']},
          {playerId: 'p0', votes: ['g1', 'g2']},
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'p2', votes: ['g1', 'g2']},
          {playerId: 'p3', votes: ['g1', 'g2']},
          {playerId: 'p4', votes: ['g1', 'g2']},
          {playerId: 'p5', votes: ['g1', 'g2']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 3},
          {goalDescriptor: 'g2', teamSize: 3},
          {goalDescriptor: 'g3', teamSize: 3},
        ],
        advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
      }

      const shouldPrune = teamFormationPlan => {
        return teamFormationPlan.teams.some(({goalDescriptor}) => goalDescriptor !== 'g1')
      }
      const results = [...ennumerateGoalChoices(pool, {}, shouldPrune)]

      expect(results.map(teamFormationPlanToString).sort()).to.deep.eq([
        '(g1:2)[], (g1:2)[], (g1:2)[], (g1:2)[], (g1:2)[], (g1:2)[]',
        '(g1:2)[], (g1:2)[], (g1:2)[], (g1:2)[], (g1:3)[]',
        '(g1:2)[], (g1:2)[], (g1:2)[], (g1:4)[]',
        '(g1:2)[], (g1:2)[], (g1:3)[], (g1:3)[]',
        '(g1:2)[], (g1:3)[], (g1:4)[]',
        '(g1:3)[], (g1:3)[], (g1:3)[]',
        '(g1:4)[], (g1:4)[]',
      ].sort())
    })

    it('returns all valid configurations', function () {
      const pool = {
        votes: [
          {playerId: 'A0', votes: ['g1', 'g2']},
          {playerId: 'A1', votes: ['g1', 'g2']},
          {playerId: 'p0', votes: ['g1', 'g2']},
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'p2', votes: ['g1', 'g2']},
          {playerId: 'p3', votes: ['g1', 'g2']},
          {playerId: 'p4', votes: ['g1', 'g2']},
          {playerId: 'p5', votes: ['g1', 'g2']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 4},
          {goalDescriptor: 'g2', teamSize: 4},
          {goalDescriptor: 'g3', teamSize: 4},
        ],
        advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
      }

      const result = [...ennumerateGoalChoices(pool)]

      expect(result.map(teamFormationPlanToString).sort()).to.deep.eq([
        // 1 paid player has 1 teams
        // 1 paid player has 1 teams
        // seatCount: 8, minTeams: 2
        '(g1:3)[], (g1:5)[]',
        '(g1:3)[], (g2:5)[]',
        '(g1:4)[], (g1:4)[]',
        '(g1:4)[], (g2:4)[]',
        '(g1:5)[], (g2:3)[]',
        '(g2:3)[], (g2:5)[]',
        '(g2:4)[], (g2:4)[]',

        // 1 paid player on 2 teams
        // 1 paid player on 1 teams
        // seatCount: 9, minTeams: 3
        '(g1:3)[], (g1:3)[], (g1:3)[]',
        '(g1:3)[], (g1:3)[], (g2:3)[]',
        '(g1:3)[], (g2:3)[], (g2:3)[]',
        '(g2:3)[], (g2:3)[], (g2:3)[]',

        // 1 paid player has 2 teams
        // 1 paid player has 2 teams
        // seatCount: 10, minTeams: 4
        //
        // --> no valid configurations; minTeamSize * minTeams > seatCount
      ].sort())
    })
  })
})
