/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import newChapters from '../newChapters'

describe(testContext(__filename), function () {
  withDBCleanup()

  before(function () {
    this.messages = []
    this.mockQueue = {add: cycle => this.messages.push(cycle)}
    newChapters(this.mockQueue)
  })

  beforeEach(function () {
    this.messages = []
  })

  it('publishes a message when chapter is created', function () {
    return factory.create('chapter').then(chapter => {
      expect(this.messages).to.have.length(1)
      expect(this.messages[0].id).to.eq(chapter.id)
    })
  })
})
