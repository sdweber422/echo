/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {GOAL_SELECTION, PRACTICE, REFLECTION} from 'src/common/models/cycle'
import {withDBCleanup, useFixture} from 'src/test/helpers'

import {Cycle} from 'src/server/services/dataService/models'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.ensureNoGlobalWindow()

  beforeEach('create moderator', async function () {
    const {commandSpec, commandImpl} = getCommand('cycle')
    this.commandSpec = commandSpec
    this.commandImpl = commandImpl
    this.moderatorUser = await factory.build('user', {roles: ['moderator']})
    this.moderator = await factory.create('moderator', {id: this.moderatorUser.id})
  })

  describe('cycle init', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: REFLECTION})
    })

    it('throws an LGBadRequestError if expected hours are not given', async function () {
      const args = this.commandSpec.parse(['init'])
      const result = this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(result).to.be.rejectedWith(/You must specify expected hours for the new cycle./)
    })

    describe('when the hours are specified', function () {
      beforeEach(async function () {
        useFixture.nockClean()
        this.args = this.commandSpec.parse(['init', '--hours=32'])
        useFixture.nockIDMGetUser(this.moderatorUser)
      })

      it('throws an LGBadRequestError if the current cycle is still in PRACTICE', async function () {
        this.cycle = await Cycle.get(this.cycle.id).update({state: PRACTICE})
        const promise = this.commandImpl.invoke(this.args, {user: this.moderatorUser})
        return expect(promise).to.be.rejectedWith(/Failed to initialize a new cycle because the current cycle is still in progress./)
      })

      it('returns an Initializing message on success and reports the default hours', async function () {
        const result = await this.commandImpl.invoke(this.args, {user: this.moderatorUser})
        expect(concatResults(result)).to.match(/Initializing/i)
        expect(concatResults(result)).to.match(/32/)
      })
    })
  })

  describe('cycle launch', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: GOAL_SELECTION})
    })

    it('returns a "Launch" message on success', async function () {
      const args = this.commandSpec.parse(['launch'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/Launch/)
    })
  })

  describe('cycle reflect', function () {
    beforeEach(async function () {
      this.cycle = await factory.create('cycle', {chapterId: this.moderator.chapterId, state: PRACTICE})
    })

    it('returns a "Reflection" message on success', async function () {
      const args = this.commandSpec.parse(['reflect'])
      const result = await this.commandImpl.invoke(args, {user: this.moderatorUser})
      expect(concatResults(result)).to.match(/Reflection/)
    })
  })
})
