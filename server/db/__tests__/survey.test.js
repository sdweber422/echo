/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {PRACTICE} from '../../../common/models/cycle'
import {parseQueryError} from '../../../server/db/errors'

import {
  getFullRetrospectiveSurveyForPlayer,
  getRetrospectiveSurveyForPlayer,
  getSurveyStats,
} from '../survey'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()
  useFixture.buildOneQuestionSurvey()

  describe('getSurveyStats()', function () {
    beforeEach(function () {
      return this.buildSurvey()
        // Complete the Survey as the first player
        .then(() =>
          factory.createMany('response', this.survey.questionRefs.map(ref => ({
            subject: ref.subject,
            surveyId: this.survey.id,
            questionId: ref.questionId,
            respondentId: this.teamPlayerIds[0],
            value: 'some value',
          })), this.survey.questionRefs.length)
        )
        .then(responses => {
          this.responses = responses
        })
        // Start, but do not complete the Survey as the second player
        .then(() =>
          factory.createMany('response', this.survey.questionRefs.map(ref => ({
            subject: ref.subject,
            surveyId: this.survey.id,
            questionId: ref.questionId,
            respondentId: this.teamPlayerIds[1],
            value: 'some value',
          })), 2)
        )
        .then(responses => {
          this.responses = this.responses.concat(responses)
        })
    })

    it('contains progress info', function () {
      return getSurveyStats(this.survey.id)
        .then(result => {
          const completedPlayerProgress = result.progress
            .find(({respondentId}) => respondentId === this.teamPlayerIds[0])
          expect(completedPlayerProgress.completed).to.be.true
          expect(completedPlayerProgress.responseCount).to.eq(4)

          const incompletePlayerProgress = result.progress
            .find(({respondentId}) => respondentId === this.teamPlayerIds[1])
          expect(incompletePlayerProgress.completed).to.be.false
          expect(incompletePlayerProgress.responseCount).to.eq(2)
        })
    })
  })

  describe('getRetrospectiveSurveyForPlayer()', function () {
    beforeEach(function () {
      return this.buildSurvey()
    })

    it('returns the correct survey', function () {
      return expect(
        getRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
      ).to.eventually.deep.eq(this.survey)
    })
  })

  describe('getFullRetrospectiveSurveyForPlayer()', function () {
    describe('with no responses', function () {
      beforeEach(function () {
        return this.buildSurvey()
      })

      it('adds a thin project and cycle', function () {
        return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
          .then(result => {
            expect(result).to.have.deep.property('cycle.id', this.survey.cycleId)
            expect(result).to.have.deep.property('project.id', this.survey.projectId)
          })
      })

      it('adds a questions array with subjects and responseIntructions', function () {
        return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
          .then(result => {
            expect(result).to.have.property('questions').with.length(this.survey.questionRefs.length)
            result.questions.forEach(question => expect(question).to.have.property('subject'))
            result.questions.forEach(question => expect(question).to.have.property('responseIntructions'))
          })
      })
    })

    describe('when a question has a response', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'player', responseType: 'text'},
          subject: () => this.teamPlayerIds[0]
        })
        .then(() =>
          factory.create('response', {
            subject: this.teamPlayerIds[0],
            surveyId: this.survey.id,
            questionId: this.survey.questionRefs[0].questionId,
            respondentId: this.teamPlayerIds[0],
            value: 'some value',
          })
        ).then(response => {
          this.response = response
        })
      })

      it('includes the response', function () {
        return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
          .then(result => {
            expect(result.questions[0]).to.have.property('response')
              .and.to.have.property('id', this.response.id)
          })
      })
    })

    describe('when a multipart subject question has no responses', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team'},
          subject: () => this.teamPlayerIds
        })
      })

      it('sets response to null, not an empty array', function () {
        return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
          .then(result => {
            expect(result.questions[0].response).to.be.null
          })
      })
    })

    describe('when a question has multiple responses', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team'},
          subject: () => this.teamPlayerIds
        })
        .then(() =>
          factory.createMany('response', this.teamPlayerIds.map(subject => ({
            subject,
            surveyId: this.survey.id,
            questionId: this.survey.questionRefs[0].questionId,
            respondentId: this.teamPlayerIds[0],
            value: 'some value',
          })), 2))
        .then(responses => {
          this.responses = responses
        })
      })

      it('includes all response parts', function () {
        return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
          .then(result => {
            expect(result.questions[0].response).to.deep.eq(this.responses)
          })
      })
    })

    describe('when no reflection cycle exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('cycles').get(this.survey.cycleId).update({state: PRACTICE})
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
            .catch(e => parseQueryError(e))
        ).to.eventually
         .have.property('message')
         .and
         .match(/no cycle in the reflection state/i)
      })
    })

    describe('when no project exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('projects').get(this.survey.projectId).delete()
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
            .catch(e => parseQueryError(e))
        ).to.eventually
         .have.property('message')
         .and
         .match(/player is not in any projects/i)
      })
    })

    describe('when no survey exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('surveys').get(this.survey.id).delete()
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
            .catch(e => parseQueryError(e))
        ).to.eventually
         .have.property('message')
         .and
         .match(/no retrospective survey/i)
      })
    })
  })
})
