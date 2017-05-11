/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)
  beforeEach(function () {
    stubs.chatService.enable()
    stubs.jobService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
    stubs.jobService.disable()
  })

  describe('processProjectStarted()', async function () {
    const chatService = require('src/server/services/chatService')
    const jobService = require('src/server/services/jobService')
    const {processProjectStarted} = require('../projectStarted')
    beforeEach(async function () {
      nock.cleanAll()
      this.project = await factory.create('project')
      this.players = await mockIdmUsersById(this.project.playerIds, null, {strict: true, times: 10})
      this.playerHandles = this.players.map(p => p.handle)
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('send a welcome message to the project members', async function () {
      await processProjectStarted(this.project)
      expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(this.playerHandles, 'Welcome to the')
    })

    it('creates a \'projectArtifactDeadlinePassed\' job', async function () {
      await processProjectStarted(this.project)
      expect(jobService.createJob).to.have.been.calledWithMatch('projectArtifactDeadlinePassed', this.project.id)
    })
  })
})
