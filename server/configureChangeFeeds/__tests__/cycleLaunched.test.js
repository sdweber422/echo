/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'
import r from '../../../db/connect'

import cycleLaunched from '../cycleLaunched'
import {GOAL_SELECTION, PRACTICE} from '../../../common/models/cycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(function () {
    this.messages = []
    const mockQueue = {add: (cycle) => this.messages.push(cycle)}
    cycleLaunched(mockQueue)
  })

  it('publishes a message when cycle state changes', function() {
    return factory.create('cycle', {state: GOAL_SELECTION}).then(cycle => {
      r.table('cycles').get(cycle.id).update({state: PRACTICE}).run()
        .then(() => expect(this.messages).to.have.length(1))
        .then(() => expect(this.messages[0].id).to.eq(cycle.id))
    })
  })
})
