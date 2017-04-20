/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, useFixture, mockIdmUsersById} from 'src/test/helpers'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processProjectArtifactChanged()', function () {
    const chatService = require('src/server/services/chatService')

    const {processProjectArtifactChanged} = require('../projectArtifactChanged')

    describe('when a project artifact has been set', function () {
      beforeEach(async function () {
        useFixture.nockClean()
        this.survey = await factory.create('survey')
        this.project = await factory.create('project', {projectReviewSurveyId: this.survey.id})
        this.players = await mockIdmUsersById(this.project.playerIds, null, {strict: true, times: 10})
        this.playerHandles = this.players.map(p => p.handle)
      })

      it('sends a direct message to the project members', async function () {
        await processProjectArtifactChanged(this.project)

        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.playerHandles, `<${this.project.artifactURL}|artifact>`)

        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.playerHandles, `#${this.project.name} has been updated`)
      })
    })
  })
})
