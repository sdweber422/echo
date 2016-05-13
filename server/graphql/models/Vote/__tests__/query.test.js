/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  const firstPlaceGoalNumber = 1
  const secondPlaceGoalNumber = 2
  const thirdPlaceGoalNumber = 3

  const goalNumberVotes = [
    [firstPlaceGoalNumber, secondPlaceGoalNumber],
    [firstPlaceGoalNumber, secondPlaceGoalNumber],
    [firstPlaceGoalNumber, thirdPlaceGoalNumber],
  ]

  beforeEach('create some votes', async function() {
    try {
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
      this.eligiblePlayers = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
      this.votes = await Promise.all(
        goalNumberVotes.map(([goal1, goal2], i) => {
          return factory.create('vote', {
            playerId: this.eligiblePlayers[i].id,
            cycleId: this.cycle.id,
            goals: [
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal1}`},
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal2}`},
            ],
          })
        })
      )
    } catch (e) {
      throw (e)
    }
  })

  const getCycleVotingResults = function () {
    return runGraphQLQuery(
      `query($cycleId: ID!) {
        getCycleVotingResults(
          cycleId: $cycleId
        )
        { id,
          cycle {id},
          numEligiblePlayers,
          numVotes,
          candidateGoals {
            goal {url},
            playerGoalRanks { playerId, goalRank }
          }
        }
      }`,
      fields,
      {cycleId: this.cycle.id},
      {currentUser: {roles: ['player']}},
    )
  }

  const assertValidCycleVotingResults = function (response) {
    expect(response.numEligiblePlayers).to.equal(this.eligiblePlayers.length)
    expect(response.numVotes).to.equal(3)
    expect(response.cycle.id).to.equal(this.cycle.id)
    expect(response.candidateGoals[0].goal.url.endsWith(`/${firstPlaceGoalNumber}`)).to.be.true
    expect(response.candidateGoals[1].goal.url.endsWith(`/${secondPlaceGoalNumber}`)).to.be.true
    expect(response.candidateGoals[2].goal.url.endsWith(`/${thirdPlaceGoalNumber}`)).to.be.true
    expect(response.candidateGoals[0].playerGoalRanks.length).to.equal(3)
    expect(response.candidateGoals[1].playerGoalRanks.length).to.equal(2)
    expect(response.candidateGoals[2].playerGoalRanks.length).to.equal(1)
  }

  it('returns results', function () {
    getCycleVotingResults.call(this)
      .then(result => assertValidCycleVotingResults.call(this, result.data.getCycleVotingResults))
  })

  describe('when there are votes from ineligible players', function () {
    beforeEach('create some ineligible votes', async function() {
      const chapter = await factory.create('chapter')
      const cycle = await factory.create('cycle', {chapterId: chapter.id})
      const player = await factory.create('player', {chapterId: chapter.id})

      factory.create('vote', {
        playerId: player.id,
        cycleId: cycle.id,
        goals: [
          {url: `${this.chapter.goalRepositoryURL}/issues/${thirdPlaceGoalNumber}`},
          {url: `${this.chapter.goalRepositoryURL}/issues/${secondPlaceGoalNumber}`},
        ],
      })
    })

    it('ignores them', function () {
      getCycleVotingResults.call(this)
        .then(result => assertValidCycleVotingResults.call(this, result.data.getCycleVotingResults))
    })
  })
})

it('getCycleVotingResults when user not logged in')
it('getCycleVotingResults when user not authorized')
it('getCycleVotingResults when no votes cast')
it('getCycleVotingResults when there are ties')
