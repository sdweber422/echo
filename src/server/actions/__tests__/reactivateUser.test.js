/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {useFixture, resetDB} from 'src/test/helpers'
import stubs from 'src/test/stubs'
import getUser from 'src/server/actions/getUser'
import reactivateUser from 'src/server/actions/reactivateUser'

import nock from 'nock'
import config from 'src/config'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(async function () {
    this.user = await factory.build('user')
    this.member = await factory.create('member', {id: this.user.id})
    useFixture.nockClean()
    this.nockIDMReactivateUser = () => {
      nock(config.server.idm.baseURL)
        .persist()
        .intercept('/graphql', 'POST')
        .reply(200, () => ({
          data: {
            reactivateUser: {
              id: this.user.id,
              active: true,
              handle: this.user.handle,
            },
          },
        }))
    }
    stubs.herokuService.enableOne('addCollaboratorToApps')
    stubs.gitHubService.enableOne('addUserToTeam')
    stubs.chatService.enableOne('reactivateUser')
  })

  afterEach(function () {
    stubs.herokuService.disableOne('addCollaboratorToApps')
    stubs.gitHubService.disableOne('addUserToTeam')
    stubs.chatService.disableOne('reactivateUser')
  })

  it('calls heroku, github, and slack and deactivates the user in idm', async function () {
    const gitHubService = require('src/server/services/gitHubService')
    const herokuService = require('src/server/services/herokuService')
    const chatService = require('src/server/services/chatService')

    useFixture.nockIDMGetUser(this.user)
    const user = await getUser(this.user.id)

    useFixture.nockIDMGetUser(this.user)
    this.nockIDMReactivateUser()
    const result = await reactivateUser(this.user.id)

    expect(gitHubService.addUserToTeam).to.have.been.calledWith(this.user.handle/* , chapter.githubTeamId */)
    expect(herokuService.addCollaboratorToApps).to.have.been.calledWith(user, config.losPermissions.heroku.apps)
    expect(chatService.reactivateUser).to.have.been.calledWith(this.user.id)
    expect(result.active).to.eql(true)
  })
})
