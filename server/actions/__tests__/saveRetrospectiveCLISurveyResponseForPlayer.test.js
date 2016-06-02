/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'
import {RETROSPECTIVE, COMPLETE} from '../../../common/models/cycle'

import saveRetrospectiveCLISurveyResponseForPlayer from '../saveRetrospectiveCLISurveyResponseForPlayer'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('team percentage questions (like RPC)', function () {
    beforeEach(async function () {
      try {
        this.project = await factory.create('project')
        const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
        await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
        await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

        this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds
        this.currentUserId = this.teamPlayerIds[0]
        this.question = await factory.create('question', {subjectType: 'team', type: 'percentage'})
        this.survey = await factory.build('survey', {
          cycleId,
          projectId: this.project.id,
          questions: [{questionId: this.question.id, subject: this.teamPlayerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
      } catch (e) {
        throw (e)
      }
    })

    it('saves the responses with the right attributes', async function () {
      try {
        await saveRetrospectiveCLISurveyResponseForPlayer(this.currentUserId, {
          questionNumber: 1,
          responseParams: this.teamPlayerIds.map(id => `${id}:25`)
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
          responseParams: this.teamPlayerIds.map(id => `${id}:50`)
        })
      ).to.be.rejected
    })
  })

  describe('single subject text questions', function () {
    beforeEach(async function () {
      try {
        this.project = await factory.create('project')
        const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
        await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
        await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

        this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds
        this.currentUserId = this.teamPlayerIds[0]
        this.question = await factory.create('question', {subjectType: 'player', type: 'text'})
        this.survey = await factory.build('survey', {
          cycleId,
          projectId: this.project.id,
          questions: [{questionId: this.question.id, subject: this.teamPlayerIds[1]}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
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
        this.project = await factory.create('project')
        const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
        await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
        await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

        this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds
        this.currentUserId = this.teamPlayerIds[0]
        this.question = await factory.create('question', {subjectType: 'player', type: 'percentage'})
        this.survey = await factory.build('survey', {
          cycleId,
          projectId: this.project.id,
          questions: [{questionId: this.question.id, subject: this.teamPlayerIds[1]}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
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
