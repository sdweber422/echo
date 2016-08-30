/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import advancedPlayersProjectsAllHaveSameGoal from '../advancedPlayersProjectsAllHaveSameGoal'

describe(testContext(__filename), function () {
  const pool = {
    goals: [
      {goalDescriptor: 'g1', teamSize: 3},
      {goalDescriptor: 'g2', teamSize: 3},
      {goalDescriptor: 'g3', teamSize: 3},
    ],
    advancedPlayers: [{id: 'A1'}, {id: 'A2'}]
  }
  it('returns the percentage of advanced players with only one goal', function () {
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
        {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
        {goalDescriptor: 'g3', playerIds: ['A2', 'p5', 'p6']},
      ]
    }

    const score = advancedPlayersProjectsAllHaveSameGoal(pool, teamFormationPlan)

    expect(score).to.eq(1 / 2)
  })

  it('returns 1 if all advanced players have just one goal', function () {
    const teamFormationPlan = {
      teams: [
        {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
        {goalDescriptor: 'g1', playerIds: ['A1', 'p3', 'p4']},
        {goalDescriptor: 'g3', playerIds: ['A2', 'p5', 'p6']},
      ]
    }

    const score = advancedPlayersProjectsAllHaveSameGoal(pool, teamFormationPlan)

    expect(score).to.eq(1)
  })

  context('teams are not complete', function () {
    const tests = [
      {
        teamFormationPlan: {
          teams: [
            {goalDescriptor: 'g1', playerIds: ['A1']},
            {goalDescriptor: 'g1', playerIds: []},
            {goalDescriptor: 'g1', playerIds: []},
          ]
        },
        expectedScore: 1,
      },
      {
        teamFormationPlan: {
          teams: [
            {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
            {goalDescriptor: 'g2', playerIds: ['A1', 'p3', 'p4']},
            {goalDescriptor: 'g3', playerIds: []},
          ]
        },
        expectedScore: 1 / 2,
      },
      {
        teamFormationPlan: {
          teams: [
            {goalDescriptor: 'g1', playerIds: ['A1', 'p1', 'p2']},
            {goalDescriptor: 'g2', playerIds: ['A2', 'p3', 'p4']},
            {goalDescriptor: 'g2', playerIds: []},
            {goalDescriptor: 'g3', playerIds: []},
          ]
        },
        expectedScore: 1 / 2,
      },
    ]

    tests.forEach(({teamFormationPlan, expectedScore}, i) => {
      it(`returns the percentage of advanced players who could end up with just one goal [${i}]`, function () {
        const score = advancedPlayersProjectsAllHaveSameGoal(pool, teamFormationPlan, {teamsAreIncomplete: true})
        expect(score).to.eq(expectedScore)
      })
    })
  })
})
