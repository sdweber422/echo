/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {GOAL_SELECTION, PRACTICE, RETROSPECTIVE} from '../../../../../common/models/cycle'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('launchCycle', function () {
    before(async function () {
      this.user = await factory.build('user', {roles: ['moderator']})
      this.launchCycle = function (id) {
        return runGraphQLMutation(
          `mutation($id: ID) { launchCycle(id: $id) { id state } }`,
          fields,
          {id},
          {currentUser: this.user},
        )
      }
    })

    beforeEach(async function () {
      this.moderator = await factory.create('moderator', {id: this.user.id})
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: GOAL_SELECTION})
    })

    it('launches the cycle associated with the moderator if no cycle is specified', function () {
      return this.launchCycle()
        .then(() => {
          const launchedCycle = r.table('cycles').get(this.cycle.id).run()
          return expect(launchedCycle).to.eventually.have.property('state', PRACTICE)
        })
    })

    it('launches the specified cycle if id given', async function () {
      const cycle = await factory.create('cycle', {state: GOAL_SELECTION})
      return this.launchCycle(cycle.id)
        .then(() => {
          const launchedCycle = r.table('cycles').get(cycle.id).run()
          return expect(launchedCycle).to.eventually.have.property('state', PRACTICE)
        })
    })
  })

  describe('updateCycleState', function () {
    before(async function () {
      this.user = await factory.build('user', {roles: ['moderator']})
      this.updateCycleState = function (id, state) {
        return runGraphQLMutation(
          `mutation($id: ID, $state: String!) { updateCycleState(id: $id, state: $state) { id state } }`,
          fields,
          {id, state},
          {currentUser: this.user},
        )
      }
    })

    beforeEach(async function () {
      this.moderator = await factory.create('moderator', {id: this.user.id})
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: PRACTICE})
    })

    it('affects the cycle associated with the moderator if no cycle is specified', function () {
      return this.updateCycleState(null, RETROSPECTIVE)
        .then(() => {
          const updatedCycle = r.table('cycles').get(this.cycle.id).run()
          return expect(updatedCycle).to.eventually.have.property('state', RETROSPECTIVE)
        })
    })

    it('affects the specified cycle if id given', async function () {
      const cycle = await factory.create('cycle', {state: PRACTICE})
      return this.updateCycleState(cycle.id, RETROSPECTIVE)
        .then(() => {
          const updatedCycle = r.table('cycles').get(cycle.id).run()
          return expect(updatedCycle).to.eventually.have.property('state', RETROSPECTIVE)
        })
    })

    it('returns an error if you try to change into anything but the "next" state', function () {
      expect(function () {
        return this.updateCycleState(this.cycle.id, GOAL_SELECTION)
      }).to.throw(Error)
    })
  })
})
