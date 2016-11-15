/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery} from 'src/test/helpers'
import {addPlayerIdsToPool} from 'src/server/db/pool'
import fields from 'src/server/graphql/models/Vote/query'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getCycleVotingResults', function () {
    beforeEach(async function () {
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
      const [pool1, pool2] = await factory.createMany('pool', {cycleId: this.cycle.id}, 2)
      this.pool1 = pool1
      this.pool2 = pool2
      this.pools = [pool1, pool2]

      this.pool1Voters = []
      this.pool1Players = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
      await addPlayerIdsToPool(pool1.id, this.pool1Players.map(_ => _.id))

      this.pool2Voters = []
      this.pool2Players = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
      await addPlayerIdsToPool(pool2.id, this.pool2Players.map(_ => _.id))

      this.poolPlayers = [this.pool1Players, this.pool2Players]

      this.players = this.pool1Players.concat(this.pool2Players)

      this.currentUser = await factory.build('user', {id: this.players[0].id})
      this.moderator = await factory.create('moderator', {id: this.currentUser.id})
    })

    const getCycleVotingResults = function (currentUser = this.currentUser) {
      return runGraphQLQuery(
        `query($cycleId: ID!) {
          getCycleVotingResults(
            cycleId: $cycleId
          )
          {
            cycle {
              id,
              state
            },
            pools {
              id,
              name,
              users { id },
              voterPlayerIds,
              candidateGoals {
                goal {url},
                playerGoalRanks { playerId, goalRank }
              },
              votingIsStillOpen,
            }
          }
        }`,
        fields,
        {cycleId: this.cycle.id},
        {currentUser},
      )
    }

    describe('when there are votes', function () {
      const voteDataForPool1 = {
        firstPlaceGoalNumber: 1,
        secondPlaceGoalNumber: 2,
        thirdPlaceGoalNumber: 3,
        goalNumberVotes: [
          [1, 2],
          [1, 2],
          [1, 3],
        ]
      }
      const voteDataForPool2 = {
        firstPlaceGoalNumber: 101,
        secondPlaceGoalNumber: 102,
        thirdPlaceGoalNumber: 103,
        goalNumberVotes: [
          [101, 102],
          [101, 102],
          [101, 103],
        ]
      }

      beforeEach('create some votes', async function () {
        await Promise.all(this.pool1Players.map((player, i) => {
          const [goal1, goal2] = voteDataForPool1.goalNumberVotes[i]
          return factory.create('vote', {
            playerId: player.id,
            poolId: this.pool1.id,
            goals: [
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal1}`},
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal2}`},
            ],
          })
        }))
        this.pool1Voters = this.pool1Players.slice()

        await Promise.all(this.pool2Players.map((player, i) => {
          const [goal1, goal2] = voteDataForPool2.goalNumberVotes[i]
          return factory.create('vote', {
            playerId: player.id,
            poolId: this.pool2.id,
            goals: [
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal1}`},
              {url: `${this.chapter.goalRepositoryURL}/issues/${goal2}`},
            ],
          })
        }))
        this.pool2Voters = this.pool2Players.slice()
      })

      const assertValidCycleVotingResults = function (result) {
        const response = result.data.getCycleVotingResults
        expect(response.cycle.id).to.equal(this.cycle.id)
        expect(response.cycle.state).to.equal(this.cycle.state)
        const responsePool1 = response.pools.find(({name}) => name === this.pool1.name)
        expect(responsePool1.name).to.equal(this.pool1.name)
        expect(responsePool1.votingIsStillOpen).to.be.true
        expect(responsePool1.users.map(_ => _.id).sort(), 'players').to.deep.equal(this.pool1Players.map(_ => _.id).sort())
        expect(responsePool1.voterPlayerIds.sort(), 'voterPlayerIds').to.deep.equal(this.pool1Voters.map(_ => _.id).sort())
        expect(responsePool1.candidateGoals[0].goal.url).to.match(new RegExp(`/${voteDataForPool1.firstPlaceGoalNumber}$`))
        expect(responsePool1.candidateGoals[1].goal.url).to.match(new RegExp(`/${voteDataForPool1.secondPlaceGoalNumber}$`))
        expect(responsePool1.candidateGoals[2].goal.url).to.match(new RegExp(`/${voteDataForPool1.thirdPlaceGoalNumber}$`))
        expect(responsePool1.candidateGoals[0].playerGoalRanks.length).to.equal(3)
        expect(responsePool1.candidateGoals[1].playerGoalRanks.length).to.equal(2)
        expect(responsePool1.candidateGoals[2].playerGoalRanks.length).to.equal(1)

        const responsePool2 = response.pools.find(({name}) => name === this.pool2.name)
        expect(responsePool2.name).to.equal(this.pool2.name)
        expect(responsePool2.votingIsStillOpen).to.be.true
        expect(responsePool2.users.map(_ => _.id).sort(), 'players').to.deep.equal(this.pool2Players.map(_ => _.id).sort())
        expect(responsePool2.voterPlayerIds.sort(), 'voterPlayerIds').to.deep.equal(this.pool2Voters.map(_ => _.id).sort())
        expect(responsePool2.candidateGoals[0].goal.url).to.match(new RegExp(`/${voteDataForPool2.firstPlaceGoalNumber}$`))
        expect(responsePool2.candidateGoals[1].goal.url).to.match(new RegExp(`/${voteDataForPool2.secondPlaceGoalNumber}$`))
        expect(responsePool2.candidateGoals[2].goal.url).to.match(new RegExp(`/${voteDataForPool2.thirdPlaceGoalNumber}$`))
        expect(responsePool2.candidateGoals[0].playerGoalRanks.length).to.equal(3)
        expect(responsePool2.candidateGoals[1].playerGoalRanks.length).to.equal(2)
        expect(responsePool2.candidateGoals[2].playerGoalRanks.length).to.equal(1)
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
        beforeEach('create an invalid vote', async function () {
          const poolId = this.pools[0].id
          const player = await factory.create('player', {chapterId: this.chapter.id})
          this.pool1Players.push(player)
          this.players.push(player)
          await addPlayerIdsToPool(poolId, [player.id])
          await factory.create('invalid vote', {playerId: player.id, poolId})
        })

        it('ignores pending votes', function () {
          return getCycleVotingResults.call(this)
            .then(result => assertValidCycleVotingResults.call(this, result))
        })
      })

      describe('when there are votes from ineligible players', function () {
        beforeEach('create some ineligible votes', async function () {
          const chapter = await factory.create('chapter')
          const cycle = await factory.create('cycle', {chapterId: chapter.id})
          const pool = await factory.create('pool', {cycleId: cycle.id})
          const player = await factory.create('player', {chapterId: chapter.id})

          await factory.create('vote', {
            playerId: player.id,
            poolId: pool.id,
            goals: [
              {url: `${this.chapter.goalRepositoryURL}/issues/98`},
              {url: `${this.chapter.goalRepositoryURL}/issues/99`},
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
