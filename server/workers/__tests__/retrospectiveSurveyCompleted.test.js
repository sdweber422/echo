/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup, useFixture} from '../../../test/helpers'

import {
  processRetrospectiveSurveyCompleted,
} from '../retrospectiveSurveyCompleted'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildOneQuestionSurvey()

  describe('processRetrospectiveSurveyCompleted()', function () {
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

    it('sends a message to the project chatroom', function () {
      const event = {
        respondentId: this.teamPlayerIds[0],
        surveyId: this.survey.id,
        projectId: this.survey.projectId,
        cycleId: this.cycleId,
      }
      return processRetrospectiveSurveyCompleted(event, this.chatClientStub).then(() => {
        const msg = this.chatClientStub.sentMessages[this.project.name][0]
        expect(msg).to.match(/submitted their reflections/)
        expect(msg).to.match(/1 \/ \d .* completed/)
      })
    })

    it('sends a message to the project chatroom ONLY once', function () {
      const event = {
        respondentId: this.teamPlayerIds[0],
        surveyId: this.survey.id,
        projectId: this.survey.projectId,
        cycleId: this.cycleId,
      }
      return Promise.all([
        processRetrospectiveSurveyCompleted(event, this.chatClientStub),
        processRetrospectiveSurveyCompleted(event, this.chatClientStub),
      ]).then(() =>
        expect(this.chatClientStub.sentMessages[this.project.name]).to.have.length(1)
      )
    })
  })
})
