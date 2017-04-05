/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import config from 'src/config'
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleInitialized()', function () {
    const chatService = require('src/server/services/chatService')
    const {Pool} = require('src/server/services/dataService')

    const {processCycleInitialized} = require('../cycleInitialized')

    describe('when a new cycle is created', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {
          chapterId: this.chapter.id,
          cycleNumber: 2,
        })
      })

      it('sends a message to the chapter chatroom', async function () {
        useFixture.nockIDMGetUsersById([])
        await processCycleInitialized(this.cycle)

        expect(chatService.sendChannelMessage.callCount).to.eq(1)

        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.chapter.channelName, `Voting is now open for cycle ${this.cycle.cycleNumber}`)

        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.chapter.channelName, `<${config.server.goalLibrary.baseURL}|the goal library>`)

        expect(chatService.sendChannelMessage).to.have.been
          .calledWithMatch(this.chapter.channelName, '/vote --help')
      })

      it('will not recreate pools if they already exist', async function () {
        useFixture.nockIDMGetUsersById([])
        await processCycleInitialized(this.cycle)
        const poolsAfterFirstRun = await Pool.filter({cycleId: this.cycle.id})

        useFixture.nockIDMGetUsersById([])
        await processCycleInitialized(this.cycle)
        const poolsAfterSecondRun = await Pool.filter({cycleId: this.cycle.id})

        expect(poolsAfterFirstRun.length).to.eq(poolsAfterSecondRun.length)
      })
    })
  })
})
