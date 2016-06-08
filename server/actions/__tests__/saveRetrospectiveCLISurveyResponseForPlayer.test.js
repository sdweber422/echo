/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import r from '../../../db/connect'
import nock from 'nock'
import {withDBCleanup, useFixture} from '../../../test/helpers'

import saveRetrospectiveCLISurveyResponseForPlayer from '../saveRetrospectiveCLISurveyResponseForPlayer'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('team percentage questions (like RPC)', function () {
    beforeEach(async function () {
      try {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team', responseType: 'percentage'},
          subject: () => this.teamPlayerIds
        })
        this.currentUserId = this.teamPlayerIds[0]
      } catch (e) {
        throw (e)
      }

      this.teamHandles = ['bob', 'alice', 'steve', 'shereef']
      nock(process.env.IDM_BASE_URL)
        .persist()
        .post('/graphql')
        .reply(200, JSON.stringify({
          data: {
            getUsersByHandles: this.teamHandles.map(
              (handle, i) => ({handle, id: this.teamPlayerIds[i]})
            )
          }
        }))
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('saves the responses with the right attributes', async function () {
      try {
        await saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: this.teamHandles.map(handle => `${handle}:25`),
        })

        const responses = await r.table('responses').run()
        expect(responses.length).to.eq(4)
        responses.forEach(response => {
          expect(response).to.have.property('surveyId', this.survey.id)
          expect(response).to.have.property('questionId', this.question.id)
          expect(response).to.have.property('respondentId', this.currentUserId)
          expect(response).to.have.property('value', 25)
          expect(response.subject).to.be.oneOf(this.teamPlayerIds)
        })
      } catch (e) {
        throw (e)
      }
    })

    it('validates percentages add up to 100', async function () {
      return expect(
        saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: this.teamHandles.map(handle => `${handle}:50`),
        })
      ).to.be.rejected
    })
  })

  describe('single subject text questions', function () {
    beforeEach(async function () {
      try {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'player', responseType: 'text'},
          subject: () => this.teamPlayerIds[1]
        })
        this.currentUserId = this.teamPlayerIds[0]
      } catch (e) {
        throw (e)
      }
    })

    it('saves the responses with the right attributes', async function () {
      try {
        await saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: ['Judy is Awesome!']
        })

        const responses = await r.table('responses').run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 'Judy is Awesome!')
        expect(responses[0].subject).to.be.oneOf(this.teamPlayerIds)
      } catch (e) {
        throw (e)
      }
    })
  })

  describe('single subject percentage questions', function () {
    beforeEach(async function () {
      try {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'player', responseType: 'percentage'},
          subject: () => this.teamPlayerIds[1]
        })
        this.currentUserId = this.teamPlayerIds[0]
      } catch (e) {
        throw (e)
      }
    })

    it('saves the responses with the right attributes', async function () {
      try {
        await saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: ['99'],
        })

        const responses = await r.table('responses').run()
        expect(responses.length).to.eq(1)
        expect(responses[0]).to.have.property('surveyId', this.survey.id)
        expect(responses[0]).to.have.property('questionId', this.question.id)
        expect(responses[0]).to.have.property('respondentId', this.currentUserId)
        expect(responses[0]).to.have.property('value', 99)
        expect(responses[0].subject).to.be.oneOf(this.teamPlayerIds)
      } catch (e) {
        throw (e)
      }
    })

    it('validates percentages are not bigger than 100', async function () {
      return expect(
        saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: ['110']
        })
      ).to.be.rejected
    })
  })
})
