/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import getProfiler from 'src/server/services/projectFormationService/profile'

import getTeamFormationPlan from '../getTeamFormationPlan'
import {buildTestPool} from 'src/server/services/projectFormationService/__tests__/util'

describe(testContext(__filename), function () {
  it('works when everyone votes for the same goal', function () {
    const input = {
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

    const teams = getTeamFormationPlan(input)

    expect(teams).to.have.length(2)

    teams.forEach(team => {
      expect(team.goalDescriptor).to.eq('g1')
      expect(team.playerIds).to.have.length(4)
      expect(
        team.playerIds.includes('A0') ||
        team.playerIds.includes('A1'),
        'team includes an advanced player'
      ).to.be.ok
    })
  })

  it('respects the advancedPlayers maxTeams is present', function () {
    const input = {
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
      advancedPlayers: [{id: 'A0'}, {id: 'A1', maxTeams: 1}],
    }

    const teams = getTeamFormationPlan(input)

    expect(
      _teamCountFor('A0', teams),
      'Advanced Player 0 is given the appropriate number of teams'
    ).to.eq(2)

    expect(
      _teamCountFor('A1', teams),
      'Advanced Player 0 is given the appropriate number of teams'
    ).to.eq(1)
  })

  it('works when two goals tie for most popular', function () {
    const input = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p3', votes: ['g2', 'g1']},
        {playerId: 'p4', votes: ['g2', 'g1']},
        {playerId: 'p5', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
      ],
      advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
    }

    const teams = getTeamFormationPlan(input)

    expect(teams).to.have.length(2)

    for (const goalDescriptor of ['g1', 'g2']) {
      const team = teams.find(_ => _.goalDescriptor === goalDescriptor)

      expect(team, 'a team is formed for each most popular goal').to.be
      expect(team.playerIds, 'each team has an advanced player').to.match(/A/)
      expect(team.playerIds, 'each team has an advanced player').to.match(/A/)
      expect(team.playerIds, 'each team gets half the players').to.have.length(4)
    }
  })

  it('will put an advanced player on multiple teams if needed', function () {
    const input = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},

        {playerId: 'A1', votes: ['g2', 'g1']},
        {playerId: 'p7', votes: ['g2', 'g1']},
        {playerId: 'p8', votes: ['g2', 'g1']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
    }

    const teams = getTeamFormationPlan(input)

    expect(teams).to.have.length(3)

    const [team1, team2] = teams.filter(_ => _.goalDescriptor === 'g1')
    const [team3] = teams.filter(_ => _.goalDescriptor === 'g2')

    expect(team1, 'two teams are formed with goal g1').to.be.ok
    expect(team2, 'two teams are formed with goal g1').to.be.ok
    expect(team3, 'one team is formed with goal g2').to.be.ok
    expect(team1.playerIds).to.include('A0')
    expect(team2.playerIds).to.include('A0')
    expect(team3.playerIds).to.include('A1')
  })

  describe.skip('performance tests', function () {
    beforeEach(function () {
      getProfiler().reset()
    })

    const minutes = n => n * 60000
    const scenarios = [
      // {
      //   pool: buildTestPool({advancedPlayerCount: 4, playerCount: 15, teamSize: 4, goalCount: 5}),
      //   expectedRuntime: minutes(1),
      // },
      {
        pool: buildTestPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 5}),
        expectedRuntime: minutes(1),
      },
      // {
      //   pool: buildTestPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 12}),
      //   expectedRuntime: minutes(2),
      // },
      // {
      //   pool: buildTestPool({advancedPlayerCount: 10, playerCount: 30, teamSize: 4, goalCount: 12}),
      //   expectedRuntime: minutes(5),
      // },
    ]

    scenarios.forEach(({pool, expectedRuntime}, i) => {
      it(`completes scenatio [${i}] in the expected time`, function () {
        this.timeout(300 * 1000)
        const start = Date.now()

        getTeamFormationPlan(pool)

        const elapsedMilliseconds = Date.now() - start
        expect(elapsedMilliseconds).to.be.lt(expectedRuntime)
      })
    })

    afterEach(function () {
      getProfiler().report()
    })
  })
})

function _teamCountFor(playerId, teams) {
  return teams.reduce(
    (result, {playerIds}) => playerIds.includes(playerId) ? result + 1 : result, 0
  )
}
