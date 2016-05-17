/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {GOAL_SELECTION, PRACTICE} from '../../../../../common/models/cycle'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('cycleLaunch', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
    })

    before(function () {
      this.launchCycle = function () {
        return runGraphQLMutation(
          `mutation { launchCycle { id state } }`,
          fields,
          {},
          {currentUser: {roles: ['moderator']}},
        )
      }
    })

    it('launches the cycle', function () {
      return this.launchCycle()
        .then(result => {
          const launchedCycle = r.table('cycles').get(this.cycle.id).run()
          return expect(launchedCycle).to.eventually.have.property('state', PRACTICE)
        })
    })

  })
})
