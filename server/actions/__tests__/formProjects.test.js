/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {assert} from 'chai'
import {truncateDBTables} from 'src/test/helpers'
import factory from 'src/test/factories'
import {Project} from 'src/server/services/dataService'
import {repeat} from 'src/server/util'
import {GOAL_SELECTION} from 'src/common/models/cycle'

import {formProjects, formProjectsIfNoneExist} from '../formProjects'

const RECOMMENDED_TEAM_SIZE = 4

describe(testContext(__filename), function () {
  describe('formProjects()', function () {
    context('all goals equally popular', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [3, 3]},
      })
    })

    context('one goal gets all votes', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [6]},
      })
    })

    context('every goal gets one vote', function () {
      _itFormsProjectsAsExpected({
        players: 6,
        votes: {distribution: [...repeat(6, 1)]},
      })
    })

    context("some people didn't vote", function () {
      _itFormsProjectsAsExpected({
        players: 10,
        votes: {distribution: [6]},
      })
    })

    context('some pools have no votes', function () {
      _itFormsProjectsAsExpected({
        players: 10,
        votes: {distribution: [6]},
        before: async test => {
          const {players} = await _generateTestData({
            cycle: test.data.cycle,
            players: 2,
            votes: {distribution: [0]},
          })
          test.data.players.push(...players)
        },
      })
    })

    context('a pool has only 1 vote', function () {
      before(truncateDBTables)
      before(async function () {
        this.data = await _generateTestData({
          players: 5,
          votes: {distribution: [5]},
        })
        this.playersIdsThatShouldGetOnTeams = this.data.players.map(_ => _.id)
        // Generate a second pool with one vote
        const {players, votes, pool} = await _generateTestData({
          cycle: this.data.cycle,
          players: 2,
          votes: {distribution: [1]},
        })
        this.poolWithoutEnoughVotes = pool
        this.data.players.push(...players)
        this.data.votes.push(...votes)
      })

      it('places other players on teams and calls the handleNonFatalError callback with an error', async function () {
        const {cycle} = this.data

        const errors = []
        const handleNonFatalError = err => errors.push(err)

        await formProjects(cycle.id, handleNonFatalError)

        const projects = await Project.run()
        const projectPlayerIds = _extractPlayerIdsFromProjects(projects)
        assert.deepEqual(this.playersIdsThatShouldGetOnTeams.sort(), projectPlayerIds.sort(),
            'Players that can be assigned to teams are')

        assert.match(errors[0].message, new RegExp(`Unable to form teams for pool ${this.poolWithoutEnoughVotes.name}`))
      })
    })
  })

  describe('formProjectsIfNoneExist()', function () {
    before(truncateDBTables)

    it('creates projects only once for a given cycle', async function () {
      const {cycle} = await _generateTestData({
        players: 6,
        votes: {distribution: [6]},
      })

      const cycleId = cycle.id

      await formProjectsIfNoneExist(cycleId)
      const initialProjects = await Project.filter({cycleId})
      console.log('first projects:', initialProjects.length)
      assert(initialProjects.length > 0, 'projectCount should be > 0')

      await formProjectsIfNoneExist(cycleId)
      const finalProjects = await Project.filter({cycleId})
      console.log('final projects:', finalProjects.length)
      assert(initialProjects.length === finalProjects.length, 'project count should not change')
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)
    this.data = {cycle, players, votes}
    options.before && await options.before(this)
    await formProjects(cycle.id)
    this.data.projects = await Project.run()
  })

  it('places all players who voted on teams, and ONLY players who voted', function () {
    const {projects, votes} = this.data

    const projectPlayerIds = _extractPlayerIdsFromProjects(projects)

    assert.strictEqual(votes.length, projectPlayerIds.length,
        'Number of players who voted does not equal number of players assigned to projects')

    projects.forEach(project => assert.property(project, 'expectedHours'))

    votes.forEach(({playerId}) => {
      const playerIdInProject = projectPlayerIds.find(id => playerId === id)
      assert.isOk(playerIdInProject, `Player ${playerId} not assigned to a project`)
    })
  })
}

async function _generateTestData(options = {}) {
  const cycle = options.cycle || await factory.create('cycle', {state: GOAL_SELECTION})
  const pool = await factory.create('pool', {cycleId: cycle.id})
  const players = await factory.createMany('player', {chapterId: cycle.chapterId}, options.players)
  const playerPools = players.map(player => ({playerId: player.id, poolId: pool.id}))
  await factory.createMany('playerPool', playerPools, playerPools.length)
  const votes = await _generateVotes(pool.id, players, options.votes)
  return {cycle, pool, players, votes}
}

function _generateVotes(poolId, players, options) {
  const voteData = _createGoalVotes(options)

  const votes = voteData.map((goalIds, i) => ({
    poolId,
    playerId: players[i].id,
    goals: goalIds.map(goalId => ({
      url: `http://ex.co/${goalId}`,
      title: `Goal ${goalId}`,
      teamSize: RECOMMENDED_TEAM_SIZE
    })),
  }))

  return factory.createMany('vote', votes, votes.length)
}

function _extractPlayerIdsFromProjects(projects) {
  const allPlayerIds = projects.reduce((result, project) => {
    project.playerIds.forEach(playerId => result.set(playerId, playerId))
    return result
  }, new Map())

  return Array.from(allPlayerIds.values())
}

function _createGoalVotes({distribution}) {
  return distribution.reduce((votes, count, i) => {
    const firstChoice = i + 100
    const secondChoice = firstChoice + 1
    const vote = [firstChoice, secondChoice]
    return votes.concat(repeat(count, vote))
  }, [])
}
