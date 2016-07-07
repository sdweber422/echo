/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('voteForGoals', function () {
    beforeEach(async function () {
      this.chapter = await factory.create('chapter')
      this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, state: 'GOAL_SELECTION'})
      this.player = await factory.create('player', {chapterId: this.chapter.id})

      this.voteGoals = [
        '1',
        'some-slug',
      ]
    })

    let voteForGoals = function () {
      const {voteGoals, player} = this

      return runGraphQLMutation(
        `mutation($goalDescriptors: [String]!) {
          voteForGoals(
            goalDescriptors: $goalDescriptors
          )
          { id }
        }`,
        fields,
        {goalDescriptors: voteGoals},
        {currentUser: {id: player.id, roles: ['player']}},
      )
    }

    const assertVoteRecorded = function () {
      return r.table('votes').limit(1).run().then(votes => {
        const vote = votes[0]

        expect(vote.cycleId).to.equal(this.cycle.id)
        expect(vote.playerId).to.equal(this.player.id)
        expect(vote.notYetValidatedGoalDescriptors).to.deep.equal(this.voteGoals)
      })
    }

    const assertCorrectIdInResponse = function (result) {
      return r.table('votes').limit(1).run().then(votes => {
        const vote = votes[0]
        expect(result.data.voteForGoals.id).to.equal(vote.id)
      })
    }

    it('records the vote', function () {
      return voteForGoals.call(this)
        .then(result => assertCorrectIdInResponse.call(this, result))
        .then(() => assertVoteRecorded.call(this))
    })

    it('rejects an attempt to vot for the same goal twice', function () {
      this.voteGoals = ['1', '1']
      return expect(voteForGoals.call(this)).to.be.rejectedWith(/You cannot vote for the same goal twice/)
    })

    describe('when player has already voted', function () {
      beforeEach(function () {
        return factory.create('vote', {
          playerId: this.player.id,
          cycleId: this.cycle.id
        }).then(vote => {
          this.initialVote = vote
        })
      })

      it('updates the vote', function () {
        return voteForGoals.call(this)
          .then(result => assertCorrectIdInResponse.call(this, result))
          .then(() => assertVoteRecorded.call(this))
          .then(() => r.table('votes').limit(1).run())
          .then(votes => votes[0])
          .then(vote => {
            expect(vote.id).to.equal(this.initialVote.id)
            expect(
              vote.updatedAt.getTime()
            ).to.not.equal(
              this.initialVote.updatedAt.getTime()
            )
          })
      })
    })

    describe('when voting for another player', function () {
      voteForGoals = function () {
        const {player, voteGoals} = this
        return factory.create('player').then(currentUser => runGraphQLMutation(
          `mutation($goalDescriptors: [String]!, $playerId: ID){
            voteForGoals(
              goalDescriptors: $goalDescriptors,
              playerId: $playerId,
            ),
            { id }
          }`,
          fields,
          {goalDescriptors: voteGoals, playerId: player.id},
          {currentUser: {id: currentUser.id, roles: ['player']}},
        ))
      }

      it('records the vote', function () {
        return voteForGoals.call(this)
          .then(result => assertCorrectIdInResponse.call(this, result))
          .then(() => assertVoteRecorded.call(this))
      })
    })

    it('behaves correctly when user not logged in')
    it('behaves correctly when user not authorized')
    it('behaves correctly when no cycle is in GOAL_SELECTION')
    it('behaves correctly when multiple cycles are in GOAL_SELECTION')
  })
})
