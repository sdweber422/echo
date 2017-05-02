/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {Survey, Project} from 'src/server/services/dataService'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.createProjectReviewSurvey()
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processProjectReviewStarted()', function () {
    const chatService = require('src/server/services/chatService')

    const {processProjectReviewStarted} = require('../projectReviewStarted')

    describe('when a project has moved into review', function () {
      beforeEach(async function () {
        useFixture.nockClean()
        await this.createProjectReviewSurvey()

        this.players = []
        this.coach = null

        const userIds = [...this.project.playerIds, this.project.coachId]
        const users = await mockIdmUsersById(userIds, null, {strict: true, times: 10})
        users.forEach(user => {
          if (user.id === this.project.coachId) {
            this.coach = user
          } else {
            this.players.push(user)
          }
        })
      })

      it('sends a message to the project\'s assigned coach', async function () {
        await processProjectReviewStarted(this.project)
        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(this.coach.handle, `Project ${this.project.name} is now ready to be reviewed.`)
      })

      it('notifies the players if an artifact needs to be set for the project', async function () {
        const updatedProject = await Project.get(this.project.id).update({artifactURL: null})
        await processProjectReviewStarted(updatedProject)
        const playerHandles = this.players.map(player => player.handle)
        expect(chatService.sendDirectMessage).to.have.been
          .calledWithMatch(playerHandles, `Please set an artifact for project ${this.project.name} to enable reviews.`)
      })

      it('does not send a message if the coach has already reviewed the project', async function () {
        await Survey.get(this.survey.id).update({completedBy: [this.project.coachId]})
        await processProjectReviewStarted(this.project)
        expect(chatService.sendDirectMessage.callCount).to.eql(0)
      })
    })
  })
})
