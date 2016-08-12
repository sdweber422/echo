/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'

import fields from 'src/server/graphql/models/Vote/query'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getCycleVotingResults', function () {
    beforeEach('set up users', async function () {
      this.currentUser = await factory.build('user')
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
      this.player = await factory.create('player', {id: this.currentUser.id})
      this.moderator = await factory.create('moderator', {id: this.currentUser.id})
      this.eligiblePlayers = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
    })

    const getCycleVotingResults = function (currentUser = this.currentUser) {
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
        {currentUser},
      )
    }

    describe('when there are votes', function () {
      const firstPlaceGoalNumber = 1
      const secondPlaceGoalNumber = 2
      const thirdPlaceGoalNumber = 3

      const goalNumberVotes = [
        [firstPlaceGoalNumber, secondPlaceGoalNumber],
        [firstPlaceGoalNumber, secondPlaceGoalNumber],
        [firstPlaceGoalNumber, thirdPlaceGoalNumber],
      ]

      beforeEach('create some votes', async function() {
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
      })

      const assertValidCycleVotingResults = function (result) {
        const response = result.data.getCycleVotingResults
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
        return getCycleVotingResults.call(this)
          .then(result => assertValidCycleVotingResults.call(this, result))
      })

      it('behaves correctly when user not logged in', function () {
        const getResults = () => getCycleVotingResults.call(this, null)
        return expect(getResults()).to.be.rejectedWith(/not authorized/)
      })

      it('behaves correctly when user is not a player or moderator', function () {
        return factory.build('user')
          .then(nonPlayerUser => {
            const getResults = () => getCycleVotingResults.call(this, nonPlayerUser)
            return expect(getResults()).to.be.rejectedWith(/not a player or moderator/)
          })
      })

      describe('when there are votes that never validated', function () {
        beforeEach('create an invalid vote', function () {
          return factory.create('player', {chapterId: this.chapter.id})
            .then(eligiblePlayer => {
              this.eligiblePlayers.push(eligiblePlayer)
              factory.create('invalid vote', {
                playerId: eligiblePlayer.id,
                cycleId: this.cycle.id,
              })
            })
        })

        it('ignores pending votes', function () {
          return getCycleVotingResults.call(this)
            .then(result => assertValidCycleVotingResults.call(this, result))
        })
      })

      describe('when there are votes from ineligible players', function () {
        beforeEach('create some ineligible votes', async function() {
          const chapter = await factory.create('chapter')
          const cycle = await factory.create('cycle', {chapterId: chapter.id})
          const player = await factory.create('player', {chapterId: chapter.id})

          await factory.create('vote', {
            playerId: player.id,
            cycleId: cycle.id,
            goals: [
              {url: `${this.chapter.goalRepositoryURL}/issues/${thirdPlaceGoalNumber}`},
              {url: `${this.chapter.goalRepositoryURL}/issues/${secondPlaceGoalNumber}`},
            ],
          })
        })

        it('ignores them', function () {
          return getCycleVotingResults.call(this)
            .then(result => assertValidCycleVotingResults.call(this, result))
        })
      })
    })

    describe('when no votes have been cast', function () {
      it('renders properly', function () {
        return getCycleVotingResults.call(this)
          .then(({data: {getCycleVotingResults: {candidateGoals}}}) => {
            return expect(candidateGoals).to.be.empty
          })
      })
    })
  })
})
