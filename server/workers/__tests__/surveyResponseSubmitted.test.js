/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'

import {
  processSurveyResponseSubmitted,
} from '../surveyResponseSubmitted'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildOneQuestionSurvey()

  describe('processSurveyResponseSubmitted()', function () {
    beforeEach('setup test data', function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {responseType: 'text', subjectType: 'player'},
        subject: () => this.teamPlayerIds[1]
      })
    })

    beforeEach('create stubs', function () {
      this.chatClientStub = {
        sentMessages: {},
        sendMessage: (channel, msg) => {
          this.chatClientStub.sentMessages[channel] = this.chatClientStub.sentMessages[channel] || []
          this.chatClientStub.sentMessages[channel].push(msg)
        }
      }
    })

    describe('when the survey has been completed', function () {
      beforeEach(function () {
        return factory.create('response', {
          questionId: this.survey.questionRefs[0].questionId,
          surveyId: this.survey.id,
          subject: this.teamPlayerIds[1],
          respondentId: this.teamPlayerIds[0],
          value: 'value',
        })
      })

      it('sends a message to the project chatroom', function () {
        const event = {
          respondentId: this.teamPlayerIds[0],
          surveyId: this.survey.id,
        }
        return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
          const msg = this.chatClientStub.sentMessages[this.project.name][0]
          expect(msg).to.match(/submitted their reflections/)
          expect(msg).to.match(/1 \/ \d .* completed/)
        })
      })

      it('sends a message to the project chatroom ONLY once', function () {
        const event = {
          respondentId: this.teamPlayerIds[0],
          surveyId: this.survey.id,
        }
        return Promise.all([
          processSurveyResponseSubmitted(event, this.chatClientStub),
          processSurveyResponseSubmitted(event, this.chatClientStub),
        ]).then(() =>
          expect(this.chatClientStub.sentMessages[this.project.name]).to.have.length(1)
        )
      })
    })

    describe('when the survey has NOT been completed', function () {
      it('does not send a message to the project chatroom', function () {
        const event = {
          respondentId: this.teamPlayerIds[0],
          surveyId: this.survey.id,
        }
        return processSurveyResponseSubmitted(event, this.chatClientStub).then(() => {
          const sentMessages = this.chatClientStub.sentMessages[this.project.name]
          expect(sentMessages).to.be.undefined
        })
      })
    })
  })
})
