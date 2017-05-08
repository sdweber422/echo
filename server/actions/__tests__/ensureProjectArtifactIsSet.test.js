/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup, mockIdmUsersById, useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  beforeEach('setup data & mocks', async function () {
    useFixture.nockClean()
    this.project = await factory.build('project')
    this.users = await mockIdmUsersById(this.project.playerIds)
  })

  const chatService = require('src/server/services/chatService')
  const ensureProjectArtifactIsSet = require('../ensureProjectArtifactIsSet')

  it('send a team DM when there is no artificat set', async function () {
    this.project.artifactURL = null
    await ensureProjectArtifactIsSet(this.project)

    const userHandles = this.users.map(_ => _.handle)
    expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(
      userHandles,
      /set your artifact/
    )
  })

  it('does nothing when there is and artificat set', async function () {
    await ensureProjectArtifactIsSet(this.project)
    expect(chatService.sendDirectMessage).to.not.have.been.called
  })
})
