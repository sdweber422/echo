/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  getNonAdvancedPlayerCount,
  getAdvancedPlayerCount,
} from '../../pool'

import getOptimalTeams, {
  getPossibleGoalConfigurations,
  goalConfigurationsToStrings,
  teamConfigurationToString,
  partitioningsToStrings,
  partitioningToString,
  getPossiblePartitionings,
  getPossibleTeamConfigurations,
  getSubsets,
  range,
  choose,
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
      advancedPlayers: ['A0', 'A1'],
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
      advancedPlayers: ['A0', 'A1'],
    }

    const teams = getOptimalTeams(input)

    expect(teams).to.have.length(2)

    const team1 = teams.find(_ => _.goalDescriptor === 'g1')
    const team2 = teams.find(_ => _.goalDescriptor === 'g2')

    expect(team1, 'a team is formed for each most popular goal').to.be.ok
    expect(team2, 'a team is formed for each most popular goal').to.be.ok
    expect(team1.playerIds.sort()).to.deep.eq(['A0', 'p0', 'p1', 'p2'])
    expect(team2.playerIds.sort()).to.deep.eq(['A1', 'p3', 'p4', 'p5'])
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
      advancedPlayers: ['A0', 'A1'],
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

  it.skip('can compute results for 30 players and 10 votes', function () {
    const input = _buildPool({advancedPlayerCount: 2, playerCount: 5, goalCount: 2})

    const start = Date.now()
    const teams = getOptimalTeams(input)
    const elapsedMilliseconds = Date.now() - start

    expect(elapsedMilliseconds).to.be.lt(15 * 1000)
    console.log('RESULT:', teamConfigurationToString(teams))
    // expect(teams).to.have.length(5)
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

  describe('getPossibleTeamConfigurations()', function () {
    const pool = {
      votes: [
        {playerId: 'A0', votes: ['g1', 'g2']},
        {playerId: 'A1', votes: ['g1', 'g2']},
        {playerId: 'A2', votes: ['g1', 'g2']},
        {playerId: 'p0', votes: ['g1', 'g2']},
        {playerId: 'p1', votes: ['g1', 'g2']},
        {playerId: 'p2', votes: ['g1', 'g2']},
        {playerId: 'p3', votes: ['g1', 'g2']},
        {playerId: 'p4', votes: ['g1', 'g2']},
        {playerId: 'p5', votes: ['g1', 'g2']},
        {playerId: 'p6', votes: ['g1', 'g2']},
        {playerId: 'p7', votes: ['g1', 'g2']},
      ],
      goals: [
        {goalDescriptor: 'g1', teamSize: 4},
        {goalDescriptor: 'g2', teamSize: 4},
        {goalDescriptor: 'g3', teamSize: 4},
      ],
      advancedPlayers: ['A0', 'A1', 'A2'],
    }
    const goalConfiguration = [
      {goalDescriptor: 'g1', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 3},
    ]
    const nonAdvancedPlayerCount = getNonAdvancedPlayerCount(pool)
    const advancedPlayerCount = getAdvancedPlayerCount(pool)

    it('returns the expected number of configurations', function () {
      const result = [...getPossibleTeamConfigurations(pool, goalConfiguration)]

      // TODO:
      // If all advanced player were considered for the extra seat this
      // would be exactly equal, but since the first advanced player will
      // always take the empty seat there are actually fewer combinations
      expect(result).to.not.have.length.gt(
        choose(advancedPlayerCount, 1) * choose(nonAdvancedPlayerCount, 2)
      )
    })

    it('accepts a pruning function', function () {
      const shouldPrune = partialTeamConfig => {
        // Prune any branch where g1 has players with even ids
        const g1Team = partialTeamConfig.find(({goalDescriptor}) => goalDescriptor === 'g1')
        return g1Team && g1Team.playerIds.some(id => id.match(/[02468]/))
      }
      const result = [...getPossibleTeamConfigurations(pool, goalConfiguration, shouldPrune)]

      expect(result).to.have.length(
        choose(advancedPlayerCount - 2, 1) *
        choose(nonAdvancedPlayerCount / 2, 2)
      )
    })
  })

  describe('getPossibleGoalConfigurations()', function () {
    it('returns all valid configurations', function () {
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
        advancedPlayers: ['A0', 'A1'],
      }

      const result = [...getPossibleGoalConfigurations(input)]

      expect(goalConfigurationsToStrings(result).sort()).to.deep.eq([
        // 1 paid player has 1 teams
        // 1 paid player has 1 teams
        // seatCount: 8, minTeams: 2
        'g1:3, g1:5',
        'g1:3, g2:5',
        'g1:4, g1:4',
        'g1:4, g2:4',
        'g1:5, g2:3',
        'g2:3, g2:5',
        'g2:4, g2:4',

        // 1 paid player on 2 teams
        // 1 paid player on 1 teams
        // seatCount: 9, minTeams: 3
        'g1:3, g1:3, g1:3',
        'g1:3, g1:3, g2:3',
        'g1:3, g2:3, g2:3',
        'g2:3, g2:3, g2:3',

        // 1 paid player has 2 teams
        // 1 paid player has 2 teams
        // seatCount: 10, minTeams: 4
        //
        // --> no valid configurations; minTeamSize * minTeams > seatCount
      ].sort())
    })

    it.skip('can compute results for 30 players and 10 votes', function () {
      const start = Date.now()

      const goalConfigurations = [...getPossibleGoalConfigurations(_largePool())]

      const elapsedMilliseconds = Date.now() - start

      expect(elapsedMilliseconds).to.be.lt(120 * 1000)
      expect(goalConfigurations).to.have.length.lt(1000000)
    })
  })

  describe('getPossiblePartitionings()', function () {
    it('retuns all possible partitionings of a list into a list of lists of given sizes', function () {
      const result = [...getPossiblePartitionings(['A', 'B', 'C', 'D'], [1, 3])]
      expect(partitioningsToStrings(result).sort()).to.deep.eq(partitioningsToStrings([
        [['A'], ['B', 'C', 'D']],
        [['B'], ['A', 'C', 'D']],
        [['C'], ['B', 'A', 'D']],
        [['D'], ['B', 'C', 'A']],
      ]).sort())
    })

    it.skip('does not emit duplicate partitionings when there are dulpicate elements', function () {
      const result = [...getPossiblePartitionings(['A', 'A', 'B'], [1, 2])]
      expect(partitioningsToStrings(result).sort()).to.deep.eq(partitioningsToStrings([
        [['A'], ['A', 'B']],
        [['B'], ['A', 'A']],
      ]).sort())
    })

    it.skip('DEBUG', function () {
      const shouldPrune = node => console.log('NODE:', partitioningToString(node))
      const result = [...getPossiblePartitionings(['A', 'B', 'C', 'D'], [3, 1], shouldPrune)]
      expect(partitioningsToStrings(result).sort()).to.deep.eq(partitioningsToStrings([
        [['A'], ['B']],
        [['B'], ['A']],
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

function _largePool() {
  return {
    votes: [
      {playerId: 'A0', votes: ['g0', 'g9']},
      {playerId: 'p0', votes: ['g0', 'g9']},
      {playerId: 'p1', votes: ['g0', 'g9']},
      {playerId: 'p2', votes: ['g0', 'g9']},
      {playerId: 'p3', votes: ['g0', 'g9']},
      {playerId: 'p4', votes: ['g0', 'g9']},

      {playerId: 'A1', votes: ['g1', 'g9']},
      {playerId: 'p5', votes: ['g1', 'g9']},
      {playerId: 'p6', votes: ['g1', 'g9']},
      {playerId: 'p7', votes: ['g1', 'g9']},
      {playerId: 'p8', votes: ['g1', 'g9']},
      {playerId: 'p9', votes: ['g1', 'g9']},

      {playerId: 'A2', votes: ['g0', 'g9']},
      {playerId: 'p10', votes: ['g0', 'g9']},
      {playerId: 'p11', votes: ['g0', 'g9']},
      {playerId: 'p12', votes: ['g0', 'g9']},
      {playerId: 'p13', votes: ['g0', 'g9']},
      {playerId: 'p14', votes: ['g0', 'g9']},

      {playerId: 'A3', votes: ['g1', 'g9']},
      {playerId: 'p15', votes: ['g1', 'g9']},
      {playerId: 'p16', votes: ['g1', 'g9']},
      {playerId: 'p17', votes: ['g1', 'g9']},
      {playerId: 'p18', votes: ['g1', 'g9']},
      {playerId: 'p19', votes: ['g1', 'g9']},

      {playerId: 'A4', votes: ['g0', 'g9']},
      {playerId: 'p20', votes: ['g0', 'g9']},
      {playerId: 'p21', votes: ['g0', 'g9']},
      {playerId: 'p22', votes: ['g0', 'g9']},
      {playerId: 'p23', votes: ['g0', 'g9']},
      {playerId: 'p24', votes: ['g0', 'g9']},
    ],
    goals: [
      {goalDescriptor: 'g0', teamSize: 4},
      {goalDescriptor: 'g1', teamSize: 4},
      {goalDescriptor: 'g2', teamSize: 4},
      {goalDescriptor: 'g3', teamSize: 4},
      {goalDescriptor: 'g4', teamSize: 4},
      {goalDescriptor: 'g5', teamSize: 5},
      {goalDescriptor: 'g6', teamSize: 5},
      {goalDescriptor: 'g7', teamSize: 5},
      {goalDescriptor: 'g8', teamSize: 5},
      {goalDescriptor: 'g9', teamSize: 5},
    ],
    advancedPlayers: ['A0', 'A1', 'A2', 'A3', 'A4'],
  }
}

function _buildPool({playerCount, advancedPlayerCount, goalCount}) {
  const pool = {}

  const goals = range(0, goalCount).map(i => ({
    goalDescriptor: `g${i}`,
    teamSize: 4
  }))
  const idToVote = (playerId, i) => ({
    playerId,
    votes: [goals[i % goals.length].goalDescriptor, goals[(i + 1) % goals.length].goalDescriptor],
  })
  const advancedPlayers = range(0, advancedPlayerCount).map(i => `A${i}`)
  const nonAdvancedPlayerIds = range(0, playerCount).map(i => `p${i}`)
  const advancedPlayerVotes = advancedPlayers.map(idToVote)
  const nonAdvancedPlayerVotes = nonAdvancedPlayerIds.map(idToVote)

  const votes = advancedPlayerVotes.concat(nonAdvancedPlayerVotes)

  return {votes, goals, advancedPlayers}
}
