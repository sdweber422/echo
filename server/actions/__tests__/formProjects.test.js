/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {assert} from 'chai'
import {truncateDBTables} from 'src/test/helpers'
import factory from 'src/test/factories'
import {findProjects} from 'src/server/db/project'
import {GOAL_SELECTION} from 'src/common/models/cycle'

import {formProjects} from 'src/server/actions/formProjects'

const RECOMMENDED_TEAM_SIZE = 4
const TEST_ADVANCED_PLAYER_ELO = 1500
const TEST_ADVANCED_PLAYER_XP = 101

describe(testContext(__filename), function () {
  describe('formProjects()', function () {
    context('fewer advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 1},
        votes: {min: 9, popular: [1, 1, 1]}, // a most popular, a 2nd most popular, a 3rd most popular
      })
    })

    context('more advanced players than popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 4},
        votes: {min: 6, popular: [1]}, // 1 most popular
      })
    })

    context('equal number of advanced players as popular votes', function () {
      _itFormsProjectsAsExpected({
        players: {total: 10, advanced: 3},
        votes: {min: 7, popular: [3]}, // 3 equally popular
      })
    })

    context('all votes equally popular', function () {
      _itFormsProjectsAsExpected({
        players: {total: 11, advanced: 4},
        votes: {min: 15, popular: [10]}, // 10 equally popular
      })
    })
  })
})

function _itFormsProjectsAsExpected(options) {
  before(truncateDBTables)

  before(function () {
    // describe test data
    const {players, votes} = options || {}
    console.log(`        players: ${players.total} total, ${players.advanced} advanced. votes: ${votes.min} min, (${votes.popular}) popular.`)
  })

  before(async function () {
    const {cycle, players, votes} = await _generateTestData(options)
    await formProjects(cycle.id)
    this.data = {cycle, players, votes, projects: await findProjects().run()}
  })

  it('places all players who voted on teams, and ONLY players who voted', function () {
    const {cycle, projects, players} = this.data

    const votingPlayers = players.advanced.concat(players.regular)
    const projectPlayerIds = _extractPlayerIdsFromProjects(cycle.id, projects)

    assert.strictEqual(votingPlayers.length, projectPlayerIds.length,
        'Number of players who voted does not equal number of players assigned to projects')

    votingPlayers.forEach(player => {
      const playerIdInProject = projectPlayerIds.find(playerId => playerId === player.id)
      assert.isOk(playerIdInProject, `Player ${player.id} not assigned to a project`)
    })
  })

  it.skip('creates project teams that all contain at least one advanced player', function () {
    const {cycle, players, projects} = this.data

    const advancedPlayers = players.advanced.reduce((result, player) => {
      result[player.id] = player
      return result
    }, {})

    projects.forEach(project => {
      const playerIds = _extractPlayerIdsFromProjects(cycle.id, [project])
      const advancedPlayerId = playerIds.find(playerId => advancedPlayers[playerId])
      assert.isOk(advancedPlayerId, `Team for project ${project.id} does not include an advanced player`)
    })
  })
}

async function _generateTestData(options = {}) {
  // generate test cycle
  const cycle = await factory.create('cycle', {state: GOAL_SELECTION})

  // generate test players
  const players = await _generatePlayers(cycle.chapterId, options.players)

  // generate test votes
  // advanced player votes will be discarded, but they must be created
  // in order for the advanced players to be assigned to teams.
  const [regularVotes, advancedVotes] = await Promise.all([
    _generateVotes(cycle.id, players.regular, options.votes),
    _generateVotes(cycle.id, players.advanced, options.votes),
  ])
  const votes = regularVotes.concat(advancedVotes)

  // return test data
  return {cycle, players, votes}
}

async function _generatePlayers(chapterId, options = {}) {
  const numTotal = options.total || 0
  const numAdvanced = options.advanced || 0
  return {
    regular: await factory.createMany('player', {chapterId}, numTotal - numAdvanced),
    advanced: await factory.createMany('player', {
      chapterId,
      stats: {
        elo: {rating: TEST_ADVANCED_PLAYER_ELO},
        xp: TEST_ADVANCED_PLAYER_XP,
      }
    }, numAdvanced)
  }
}

function _generateVotes(cycleId, players, options) {
  let voteData = _createGoalVotes(options)

  if (!(players.length >= voteData.length) && !options.requireAllVotes) {
    voteData = voteData.slice(0, players.length)
  }

  const votes = voteData.map((goalIds, i) => ({
    cycleId,
    playerId: players[i].id,
    goals: goalIds.map(goalId => ({
      url: `http://ex.co/${goalId}`,
      title: `Goal ${goalId}`,
      teamSize: RECOMMENDED_TEAM_SIZE
    })),
  }))

  return factory.createMany('vote', votes, votes.length)
}

function _extractPlayerIdsFromProjects(cycleId, projects) {
  const playerIds = projects.reduce((result, project) => {
    project.cycleHistory
      .find(projectCycle => projectCycle.cycleId === cycleId)
      .playerIds.forEach(playerId => result.set(playerId, playerId))
    return result
  }, new Map())

  return Array.from(playerIds.values())
}

function _createGoalVotes(options) {
  const {min, popular} = options || {}
  const totalNumPopularGoals = Array.isArray(popular) ? popular.reduce((result, numPopularVotes) => {
    return result + numPopularVotes
  }, 0) : 0

  if (!min && !totalNumPopularGoals) {
    throw new Error('Must provide either min or popular vote count')
  }

  const votes = []
  let baseGoalId = 0

  // add popular votes (if specified)
  if (popular) {
    let numVotesPerGoal = 2

    // starting from the end, iterate through the collection
    // of specified vote counts for popular goals to be created
    for (let i = popular.length - 1; i >= 0; numVotesPerGoal++, i--) {
      const numGoalsToCreateVotesFor = popular[i]

      // iterate through each of the distinct popular goals that need votes created
      for (let j = 0; j < numGoalsToCreateVotesFor; j++) {
        baseGoalId = _nextGoalSeriesForVotes(baseGoalId)

        for (let k = 0; k < numVotesPerGoal; k++) {
          votes.push([baseGoalId, baseGoalId + j + k + 1])
        }
      }
    }
  }

  // fill as necessary with unique goal votes up to <min>
  while (min > votes.length) {
    baseGoalId = _nextGoalSeriesForVotes(baseGoalId)
    votes.push([baseGoalId, baseGoalId + 1])
  }

  return votes
}

function _nextGoalSeriesForVotes(currentSeries = 0) {
  return currentSeries + 100
}
