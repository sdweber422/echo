/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  saveVote,
  getVoteById,
  votesTable,
} from 'src/server/db/vote'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveVote()', function () {
    beforeEach(async function () {
      this.vote = await factory.create('vote')
    })

    it('updates existing record when id provided', function () {
      const updatedVote = Object.assign({}, this.vote, {newAttr: 'newVal'})
      return saveVote(updatedVote)
        .then(() => getVoteById(this.vote.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new id provided', async function () {
      const newVote = await factory.build('vote')
      await saveVote(newVote)
      const count = await votesTable.count()
      expect(count).to.eq(2)
    })
  })
})
