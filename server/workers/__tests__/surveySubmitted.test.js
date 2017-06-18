/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'
import {resetDB, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {IN_PROGRESS, CLOSED} from 'src/common/models/project'
import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    stubs.chatService.enable()
  })

  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('processSurveySubmitted()', function () {
    const chatService = require('src/server/services/chatService')
    const {Project, Survey} = require('src/server/services/dataService')

    const {processSurveySubmitted} = require('../surveySubmitted')

    describe('for retrospective surveys', function () {
      useFixture.buildOneQuestionSurvey()

      beforeEach('setup test data', async function () {
        useFixture.nockClean()
        await Promise.all(
          Object.values(FEEDBACK_TYPE_DESCRIPTORS)
            .map(descriptor => factory.create('feedbackType', {descriptor}))
        )
        await this.buildOneQuestionSurvey({
          questionAttrs: {responseType: 'text', subjectType: 'player'},
          subjectIds: () => [this.project.playerIds[1]],
          projectState: IN_PROGRESS,
        })
        useFixture.nockClean()
        const {playerIds} = this.project
        this.users = await mockIdmUsersById(playerIds, null, {times: 10})
        this.handles = this.users.map(user => user.handle)
      })

      describe('when the survey has been completed by 1 player', function () {
        beforeEach(async function () {
          const respondentId = this.project.playerIds[0]
          await Promise.all([
            factory.create('response', {
              respondentId,
              questionId: this.survey.questionRefs[0].questionId,
              surveyId: this.survey.id,
              subjectId: this.project.playerIds[1],
              value: 'value',
            }),
            Survey.get(this.survey.id).updateWithTimestamp({completedBy: [respondentId]}),
          ])
          await processSurveySubmitted({
            respondentId,
            survey: {id: this.survey.id},
          })
        })

        it('sends a message to the project chatroom', function () {
          expect(chatService.sendDirectMessage.callCount).to.eq(1)
          expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(this.handles, 'submitted their reflections')
          expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(this.handles, 'completed')
        })

        it('sends a message to the project chatroom EVERY time', async function () {
          await processSurveySubmitted({
            respondentId: this.project.playerIds[0],
            survey: {id: this.survey.id},
          })
          expect(chatService.sendDirectMessage.callCount).to.eq(2)
        })
      })

      describe('when the survey has been completed by the whole team', function () {
        beforeEach(async function () {
          return Promise.all([
            factory.createMany('response', this.project.playerIds.map(respondentId => ({
              respondentId,
              questionId: this.survey.questionRefs[0].questionId,
              surveyId: this.survey.id,
              subjectId: this.project.playerIds[1],
              value: 'u da best!',
            })), this.project.playerIds.length),
            Survey.get(this.survey.id).updateWithTimestamp({completedBy: this.project.playerIds}),
          ])
        })

        it('sends a DM to each player', async function () {
          await processSurveySubmitted({
            respondentId: this.project.playerIds[0],
            survey: {id: this.survey.id},
          })
          // 4 calls (1 for each user) plus 1 call (group DM) to all users
          expect(chatService.sendDirectMessage.callCount).to.eq(this.users.length + 1)
          this.users.forEach(user => (
            expect(chatService.sendDirectMessage).to.have.been.calledWithMatch(user.handle, 'RETROSPECTIVE COMPLETE')
          ))
        })

        it('updates project state to CLOSED', async function () {
          await processSurveySubmitted({
            respondentId: this.project.playerIds[0],
            survey: {id: this.survey.id},
          })
          const updatedProject = await Project.get(this.project.id)
          expect(updatedProject.state).to.eq(CLOSED)
        })
      })
    })
  })
})
