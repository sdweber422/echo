/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {Survey} from 'src/server/services/dataService'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.createProjectReviewSurvey()

  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processCycleCompleted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processProjectReviewStarted} = require('../projectReviewStarted')

    describe('when a project has moved into review', function () {
      beforeEach(async function () {
        await this.createProjectReviewSurvey()
        this.coach = (await mockIdmUsersById([this.project.coachId]))[0]
      })

      it('sends a message to the project\'s assigned coach', async function () {
        await processProjectReviewStarted(this.project)
        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.coach.handle, `Project ${this.project.name} is now ready to be reviewed.`)
      })

      it('does not send a message if the coach has already reviewed the project', async function () {
        await Survey.get(this.survey.id).update({completedBy: [this.coach.id]})
        await processProjectReviewStarted(this.project)
        expect(chatService.sendDirectMessage.callCount).to.eql(0)
      })
    })
  })
})
