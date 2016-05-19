/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'
import r from '../../../db/connect'

import newOrUpdatedVotes from '../newOrUpdatedVotes'

describe(testContext(__filename), function () {
  withDBCleanup()

  before(function () {
    this.messages = []
    this.mockQueue = {add: cycle => this.messages.push(cycle)}
    newOrUpdatedVotes(this.mockQueue)
  })

  beforeEach(function () {
    this.messages = []
  })

  it('publishes a message when vote is created', function () {
    return factory.create('vote', {pendingValidation: true}).then(vote => {
      expect(this.messages).to.have.length(1)
      expect(this.messages[0].id).to.eq(vote.id)
    })
  })

  it('publishes a message when vote is updated', async function () {
    const vote = await factory.create('vote')
    await r.table('votes')
      .get(vote.id)
      .update({
        pendingValidation: true,
        notYetValidatedGoalDescriptors: ['2','3']
      })
      .run()
    expect(this.messages).to.have.length(1)
    expect(this.messages[0].id).to.eq(vote.id)
  })

  it('does not publis a message when vote does not need validation', async function () {
    const vote = await factory.create('vote')
    await r.table('votes')
      .get(vote.id)
      .update({updatedAt: new Date()})
      .run()
    expect(this.messages).to.be.empty
  })
})
