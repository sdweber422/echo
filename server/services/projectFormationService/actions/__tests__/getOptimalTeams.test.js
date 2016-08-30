/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  getNonAdvancedPlayerCount,
  getAdvancedPlayerCount,
  getNonAdvancedPlayerIds,
} from '../../pool'

import {
  range,
  choose,
} from '../../util'

import getOptimalTeams, {
  ennumerateGoalChoices,
  ennumeratePlayerAssignmentChoices,
  teamFormationPlanToString,
  getPossiblePartitionings,
  heuristicPlayerAssignment,
  getSubsets,
} from '../getOptimalTeams'

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

    const teams = getOptimalTeams(input)

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

    const teams = getOptimalTeams(input)

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

    const teams = getOptimalTeams(input)

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

    const teams = getOptimalTeams(input)

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
    const minutes = n => n * 60000
    const scenarios = [
      {
        pool: _buildPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 5}),
        expectedRuntime: minutes(1),
      },
      {
        pool: _buildPool({advancedPlayerCount: 4, playerCount: 30, teamSize: 4, goalCount: 12}),
        expectedRuntime: minutes(5),
      },
      {
        pool: _buildPool({advancedPlayerCount: 6, playerCount: 30, teamSize: 4, goalCount: 12}),
        expectedRuntime: minutes(5),
      },
    ]
    scenarios.forEach(({pool, expectedRuntime}, i) => {
      it(`completes scenatio [${i}] in the expected time`, function () {
        this.timeout(300 * 1000)
        const start = Date.now()

        getOptimalTeams(pool)

        const elapsedMilliseconds = Date.now() - start
        expect(elapsedMilliseconds).to.be.lt(expectedRuntime)
      })
    })
  })

  describe('getSubsets()', function () {
    it('returns all subsets for 4 choose 3', function () {
      expect([...getSubsets(['A', 'B', 'C', 'D'], 3)]).to.deep.eq([
        ['A', 'B', 'C'],
        ['A', 'B', 'D'],
        ['A', 'C', 'D'],
        ['B', 'C', 'D'],
      ])
    })
    it('returns all subsets for 5 choose 3', function () {
      expect([...getSubsets(['A', 'B', 'C', 'D', 'E'], 3)]).to.deep.eq([
        ['A', 'B', 'C'],
        ['A', 'B', 'D'],
        ['A', 'B', 'E'],
        ['A', 'C', 'D'],
        ['A', 'C', 'E'],
        ['A', 'D', 'E'],
        ['B', 'C', 'D'],
        ['B', 'C', 'E'],
        ['B', 'D', 'E'],
        ['C', 'D', 'E'],
      ])
    })
    it('returns all subsets for 5 choose 4', function () {
      expect([...getSubsets(['A', 'B', 'C', 'D', 'E'], 4)]).to.deep.eq([
        ['A', 'B', 'C', 'D'],
        ['A', 'B', 'C', 'E'],
        ['A', 'B', 'D', 'E'],
        ['A', 'C', 'D', 'E'],
        ['B', 'C', 'D', 'E'],
      ])
    })
    it.skip('does not emit duplicate subsets when there are dulpicate elements', function () {
      expect([...getSubsets(['A', 'A', 'C', 'D'], 3)]).to.deep.eq([
        ['A', 'A', 'C'],
        ['A', 'A', 'D'],
        ['A', 'C', 'D'],
      ])
    })
    it('accepts a pruning function', function () {
      const shouldPrune = partialSubset => partialSubset.includes('C')
      expect([...getSubsets(['A', 'B', 'C', 'D', 'E'], 4, shouldPrune)]).to.deep.eq([
        ['A', 'B', 'D', 'E'],
      ])
    })
  })

  describe('ennumeratePlayerAssignmentChoices()', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g1', 'g2']},
        {playerId: 'A2', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ],
      advancedPlayers: [{id: 'A0'}, {id: 'A1'}, {id: 'A2'}],
    }
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', teamSize: 2},
        {goalDescriptor: 'g2', teamSize: 2},
        {goalDescriptor: 'g3', teamSize: 2},
      ]
    }
    const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
    const advancedPlayerCount = getAdvancedPlayerCount(pool)

    it('returns the expected number of plans', function () {
      const result = [...ennumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

      expect(result).to.have.length(
        choose(advancedPlayerCount, 1) *
        choose(advancedPlayerCount - 1, 1) *
        choose(nonAdvancedPlayerCount, 1) *
        choose(nonAdvancedPlayerCount - 1, 1)
      )
    })

    it('returns the expected plans', function () {
      const result = [...ennumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

      expect(result.map(teamFormationPlanToString).sort()).to.have.deep.eq([
        '(g1:2)[A0,p0], (g2:2)[A1,p1], (g3:2)[A2,p2]',
        '(g1:2)[A0,p0], (g2:2)[A1,p2], (g3:2)[A2,p1]',
        '(g1:2)[A0,p0], (g2:2)[A2,p1], (g3:2)[A1,p2]',
        '(g1:2)[A0,p0], (g2:2)[A2,p2], (g3:2)[A1,p1]',
        '(g1:2)[A0,p1], (g2:2)[A1,p0], (g3:2)[A2,p2]',
        '(g1:2)[A0,p1], (g2:2)[A1,p2], (g3:2)[A2,p0]',
        '(g1:2)[A0,p1], (g2:2)[A2,p0], (g3:2)[A1,p2]',
        '(g1:2)[A0,p1], (g2:2)[A2,p2], (g3:2)[A1,p0]',
        '(g1:2)[A0,p2], (g2:2)[A1,p0], (g3:2)[A2,p1]',
        '(g1:2)[A0,p2], (g2:2)[A1,p1], (g3:2)[A2,p0]',
        '(g1:2)[A0,p2], (g2:2)[A2,p0], (g3:2)[A1,p1]',
        '(g1:2)[A0,p2], (g2:2)[A2,p1], (g3:2)[A1,p0]',
        '(g1:2)[A1,p0], (g2:2)[A0,p1], (g3:2)[A2,p2]',
        '(g1:2)[A1,p0], (g2:2)[A0,p2], (g3:2)[A2,p1]',
        '(g1:2)[A1,p0], (g2:2)[A2,p1], (g3:2)[A0,p2]',
        '(g1:2)[A1,p0], (g2:2)[A2,p2], (g3:2)[A0,p1]',
        '(g1:2)[A1,p1], (g2:2)[A0,p0], (g3:2)[A2,p2]',
        '(g1:2)[A1,p1], (g2:2)[A0,p2], (g3:2)[A2,p0]',
        '(g1:2)[A1,p1], (g2:2)[A2,p0], (g3:2)[A0,p2]',
        '(g1:2)[A1,p1], (g2:2)[A2,p2], (g3:2)[A0,p0]',
        '(g1:2)[A1,p2], (g2:2)[A0,p0], (g3:2)[A2,p1]',
        '(g1:2)[A1,p2], (g2:2)[A0,p1], (g3:2)[A2,p0]',
        '(g1:2)[A1,p2], (g2:2)[A2,p0], (g3:2)[A0,p1]',
        '(g1:2)[A1,p2], (g2:2)[A2,p1], (g3:2)[A0,p0]',
        '(g1:2)[A2,p0], (g2:2)[A0,p1], (g3:2)[A1,p2]',
        '(g1:2)[A2,p0], (g2:2)[A0,p2], (g3:2)[A1,p1]',
        '(g1:2)[A2,p0], (g2:2)[A1,p1], (g3:2)[A0,p2]',
        '(g1:2)[A2,p0], (g2:2)[A1,p2], (g3:2)[A0,p1]',
        '(g1:2)[A2,p1], (g2:2)[A0,p0], (g3:2)[A1,p2]',
        '(g1:2)[A2,p1], (g2:2)[A0,p2], (g3:2)[A1,p0]',
        '(g1:2)[A2,p1], (g2:2)[A1,p0], (g3:2)[A0,p2]',
        '(g1:2)[A2,p1], (g2:2)[A1,p2], (g3:2)[A0,p0]',
        '(g1:2)[A2,p2], (g2:2)[A0,p0], (g3:2)[A1,p1]',
        '(g1:2)[A2,p2], (g2:2)[A0,p1], (g3:2)[A1,p0]',
        '(g1:2)[A2,p2], (g2:2)[A1,p0], (g3:2)[A0,p1]',
        '(g1:2)[A2,p2], (g2:2)[A1,p1], (g3:2)[A0,p0]',
      ].sort())
    })

    it('returns plans with the same goal selections as in root plan', function () {
      const result = [...ennumeratePlayerAssignmentChoices(pool, teamFormationPlan)]

      result.forEach(newPlan =>
        expect(
          newPlan.teams.map(({goalDescriptor, teamSize}) => ({goalDescriptor, teamSize}))
        ).to.deep.eq(
          teamFormationPlan.teams
        )
      )
    })

    it('accepts a pruning function', function () {
      const shouldPrune = teamFormationPlan => {
        // Prune any branch where g1 has players with even ids
        const g1Team = teamFormationPlan.teams.find(({goalDescriptor}) => goalDescriptor === 'g1')
        const prune = g1Team && g1Team.playerIds.some(id => id.match(/[02468]/))
        return prune
      }
      const result = [...ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)]
      const oddAdvancedPlayerCount = 2
      const oddNonAdvancedPlayerCount = 2

      expect(result).to.have.length(
        choose(oddAdvancedPlayerCount, 1) *
        choose(oddNonAdvancedPlayerCount, 1)
      )
    })
  })

  describe('heuristicPlayerAssignment()', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g3']},
        {playerId: 'A1', votes: ['g3', 'g2']},
        {playerId: 'p0', votes: ['g3', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g3']},
        {playerId: 'p2', votes: ['g3', 'g2']},
        {playerId: 'p4', votes: ['g4', 'g3']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 3},
        {goalDescriptor: 'g2', teamSize: 3},
        {goalDescriptor: 'g3', teamSize: 3},
        {goalDescriptor: 'g4', teamSize: 3},
      ],
      advancedPlayers: [{id: 'A0'}, {id: 'A1'}],
    }
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', teamSize: 3, playerIds: ['A0']},
        {goalDescriptor: 'g2', teamSize: 3, playerIds: ['A1']},
      ]
    }

    it('returns a valid teamFormationPlan', function () {
      const result = heuristicPlayerAssignment(pool, teamFormationPlan, getNonAdvancedPlayerIds(pool))

      result.teams.forEach(team => {
        expect(team.playerIds).to.have.length(team.teamSize)
        expect(team.playerIds.every(id => id.match(/[Ap]\d/)), 'player ids are all valid').to.be.ok
      })
    })
  })

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

  describe('getPossiblePartitionings()', function () {
    function _partitioningsToStrings(partitionings) {
      return partitionings.map(_partitioningToString)
    }

    function _partitioningToString(partitioning) {
      return partitioning.map(partition =>
        `[${partition.sort().join(',')}]`
      ).join(', ')
    }

    it('retuns all possible partitionings of a list into a list of lists of given sizes', function () {
      const result = [...getPossiblePartitionings(['A', 'B', 'C', 'D'], [1, 3])]
      expect(_partitioningsToStrings(result).sort()).to.deep.eq(_partitioningsToStrings([
        [['A'], ['B', 'C', 'D']],
        [['B'], ['A', 'C', 'D']],
        [['C'], ['B', 'A', 'D']],
        [['D'], ['B', 'C', 'A']],
      ]).sort())
    })

    it.skip('does not emit duplicate partitionings when there are dulpicate elements', function () {
      const result = [...getPossiblePartitionings(['A', 'A', 'B'], [1, 2])]
      expect(_partitioningsToStrings(result).sort()).to.deep.eq(_partitioningsToStrings([
        [['A'], ['A', 'B']],
        [['B'], ['A', 'A']],
      ]).sort())
    })

    it('returns the expected number of results', function () {
      const result = [...getPossiblePartitionings(range(0, 7), [2, 3, 2])]
      expect(result).to.have.length(choose(7, 2) * choose(5, 3))
    })

    it('accepts a pruning function to prune the tree', function () {
      const n = 4
      const k1 = 2
      const k2 = 2
      const shouldPrune = partialPartitioning => partialPartitioning[0].includes(0)
      const result = [...getPossiblePartitionings(range(0, n), [k1, k2], shouldPrune)]
      expect(result).to.have.length(choose(n, k1) / 2)
    })

    it.skip('handles large partitionings is a reasonable time', function () {
      const start = Date.now()
      const result = [...getPossiblePartitionings(range(0, 25), [4, 16, 6])]
      const elapsedMilliseconds = Date.now() - start

      expect(elapsedMilliseconds).to.be.lt(15 * 1000)
      expect(result).to.have.length(choose(25, 4) * choose(25, 16))
    })
  })
})

function _teamCountFor(playerId, teams) {
  return teams.reduce(
    (result, {playerIds}) => playerIds.includes(playerId) ? result + 1 : result, 0
  )
}

function _buildPool({playerCount, advancedPlayerCount, goalCount, teamSize}) {
  teamSize = teamSize || 4
  const goals = range(0, goalCount).map(i => ({
    goalDescriptor: `g${i}`,
    teamSize,
  }))
  const playerInfoToVote = (playerInfo, i) => ({
    playerId: playerInfo.id,
    votes: [goals[i % goals.length].goalDescriptor, goals[(i + 1) % goals.length].goalDescriptor],
  })
  const advancedPlayers = range(0, advancedPlayerCount).map(i => ({id: `A${i}`}))
  const nonAdvancedPlayerIds = range(0, playerCount).map(i => ({id: `p${i}`}))
  const advancedPlayerVotes = advancedPlayers.map(playerInfoToVote)
  const nonAdvancedPlayerVotes = nonAdvancedPlayerIds.map(playerInfoToVote)

  const votes = advancedPlayerVotes.concat(nonAdvancedPlayerVotes)

  return {votes, goals, advancedPlayers}
}
