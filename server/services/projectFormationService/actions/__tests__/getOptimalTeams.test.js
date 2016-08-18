/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import getOptimalTeams, {
  getPossibleGoalConfigurations,
  goalConfigurationsToStrings,
} from '../getOptimalTeams'

describe(testContext(__filename), function () {
  it('works when everyone votes for the same goal', function () {
    const input = {
      votes: [
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},
        {playerId: 'p5', votes: ['g1', 'g2']},
        {playerId: 'p6', votes: ['g1', 'g2']},
        {playerId: 'p7', votes: ['g1', 'g2']},
        {playerId: 'p8', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
        {goalDescriptor: 'g3', teamSize: 4},
      ],
      advancedPlayers: ['p1', 'p2'],
    }

    const teams = getOptimalTeams(input)

    expect(teams).to.have.length(2)

    teams.forEach(team => {
      expect(team.goalDescriptor).to.eq('g1')
      expect(team.playerIds).to.have.length(4)
      expect(
        team.playerIds.includes('p1') ||
        team.playerIds.includes('p2'),
        'team includes an advanced player'
      ).to.be.ok
    })
  })

  it('works when two goals tie for most popular', function () {
    const input = {
      votes: [
        {playerId: 'p1', votes: ['g1', 'g3']},
        {playerId: 'p2', votes: ['g2', 'g3']},
        {playerId: 'p3', votes: ['g1', 'g3']},
        {playerId: 'p4', votes: ['g2', 'g3']},
        {playerId: 'p5', votes: ['g1', 'g3']},
        {playerId: 'p6', votes: ['g2', 'g3']},
        {playerId: 'p7', votes: ['g1', 'g3']},
        {playerId: 'p8', votes: ['g2', 'g3']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
        {goalDescriptor: 'g3', teamSize: 4},
      ],
      advancedPlayers: ['p1', 'p2'],
    }

    const teams = getOptimalTeams(input)

    expect(teams).to.have.length(2)

    const team1 = teams.find(_ => _.goalDescriptor === 'g1')
    const team2 = teams.find(_ => _.goalDescriptor === 'g2')

    expect(team1, 'a team is formed for each most popular goal').to.be.ok
    expect(team2, 'a team is formed for each most popular goal').to.be.ok
    expect(team1.playerIds.sort()).to.deep.eq(['p1', 'p3', 'p5', 'p7', 'p9'])
    expect(team2.playerIds.sort()).to.deep.eq(['p2', 'p4', 'p6', 'p8', 'p10'])
  })

  describe('getPossibleGoalConfigurations()', function () {
    it('works', function () {
      const input = {
        votes: [
          {playerId: 'p1', votes: ['g1', 'g2']},
          {playerId: 'p2', votes: ['g1', 'g2']},
          {playerId: 'p3', votes: ['g1', 'g2']},
          {playerId: 'p4', votes: ['g1', 'g2']},
          {playerId: 'p5', votes: ['g1', 'g2']},
          {playerId: 'p6', votes: ['g1', 'g2']},
          {playerId: 'p7', votes: ['g1', 'g2']},
          {playerId: 'p8', votes: ['g1', 'g2']},
        ],
        goals: [
          {goalDescriptor: 'g1', teamSize: 4},
          {goalDescriptor: 'g2', teamSize: 4},
          {goalDescriptor: 'g3', teamSize: 4},
        ],
        advancedPlayers: ['p1', 'p2'],
      }

      const result = getPossibleGoalConfigurations(input)

      expect(goalConfigurationsToStrings(result)).to.deep.eq([
        'g1:3, g1:5',
        'g1:3, g2:5',
        'g1:4, g1:4',
        'g1:4, g2:4',
        'g1:5, g2:3',
        'g2:3, g2:5',
        'g2:4, g2:4',
      ])
    })
  })
})
