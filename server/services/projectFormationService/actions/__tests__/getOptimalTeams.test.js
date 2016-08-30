/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {
  getNonAdvancedPlayerCount,
  getAdvancedPlayerCount,
} from '../../pool'

import getOptimalTeams, {
  ennumerateGoalChoices,
  ennumeratePlayerAssignmentChoices,
  humanizeTeamFormationPlan,
  // goalConfigurationsToStrings,
  teamConfigurationToString,
  partitioningsToStrings,
  // partitioningToString,
  getPossiblePartitionings,
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
    const input = _buildPool({advancedPlayerCount: 6, playerCount: 30, goalCount: 2})

    const start = Date.now()
    const teams = getOptimalTeams(input)
    const elapsedMilliseconds = Date.now() - start

    console.log('RESULT:', teamConfigurationToString(teams))
    expect(elapsedMilliseconds).to.be.lt(15 * 1000)
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
      advancedPlayers: ['A0', 'A1', 'A2'],
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

      expect(result.map(humanizeTeamFormationPlan).sort()).to.have.deep.eq([
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
        advancedPlayers: ['A0', 'A1'],
      }

      const results = [...ennumerateGoalChoices(pool)]

      const expectedFirstResults = [
        '(g1:3)[], (g1:3)[], (g1:3)[]',
        '(g1:3)[], (g1:3)[], (g2:3)[]',
        '(g1:3)[], (g2:3)[], (g2:3)[]',
        '(g2:3)[], (g2:3)[], (g2:3)[]',
      ]
      const firstResults = results.slice(0, expectedFirstResults.length)

      expect(firstResults.map(humanizeTeamFormationPlan).sort()).to.deep.eq(expectedFirstResults.sort())
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
        advancedPlayers: ['A0', 'A1'],
      }

      const result = [...ennumerateGoalChoices(pool)]

      expect(result.map(humanizeTeamFormationPlan).sort()).to.deep.eq([
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
