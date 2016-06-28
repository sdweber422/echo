/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, expectArraysToContainTheSameElements} from '../../../test/helpers'
import {
  getRetrospectiveSurveyBlueprint,
  getProjectReviewSurveyBlueprint,
} from '../../db/surveyBlueprint'

import {
  updateRetrospectiveQuestions,
  updateProjectReviewQuestions,
} from '../updateSurveyQuestions'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('updateRetrospectiveQuestions', function () {
    beforeEach(async function () {
      this.questions = await factory.buildMany('configured question', 5)
    })

    it('creates a surveyBlueprint for the retrospective', function () {
      return updateRetrospectiveQuestions(this.questions)
        .then(async () => {
          const questionIds = this.questions.map(question => question.id)
          const surveyBlueprint = await getRetrospectiveSurveyBlueprint()
          expect(surveyBlueprint.defaultQuestionRefs).to.deep.equal(questionIds.map(questionId => ({questionId})))
        })
    })

    it('creates a question in the database for each question', function () {
      return updateRetrospectiveQuestions(this.questions)
        .then(async () => {
          const questionIds = this.questions.map(question => question.id)
          const dbQuestions = await r.table('questions').getAll(...questionIds).run()
          expect(dbQuestions.length).to.equal(this.questions.length)
          dbQuestions.forEach(dbQuestion => {
            expect(dbQuestion).to.have.property('createdAt')
            expect(dbQuestion).to.have.property('updatedAt')
          })
        })
    })
  })

  describe('updateProjectReviewQuestions', function () {
    beforeEach(async function () {
      this.questions = await factory.buildMany('configured question', [
        {body: 'something something quality'},
        {body: 'something something complete'},
      ])
    })

    it('creates a surveyBlueprint for the project review', function () {
      return updateProjectReviewQuestions(this.questions)
        .then(async () => {
          const surveyBlueprint = await getProjectReviewSurveyBlueprint()
          expectArraysToContainTheSameElements(
            surveyBlueprint.defaultQuestionRefs.map(({questionId}) => questionId),
            this.questions.map(({id}) => id)
          )
          expectArraysToContainTheSameElements(
            surveyBlueprint.defaultQuestionRefs.map(({name}) => name),
            ['completeness', 'quality']
          )
        })
    })

    it('creates a question in the database for each question', function () {
      return updateProjectReviewQuestions(this.questions)
        .then(async () => {
          const questionIds = this.questions.map(question => question.id)
          const dbQuestions = await r.table('questions').getAll(...questionIds).run()
          expect(dbQuestions.length).to.equal(this.questions.length)
          dbQuestions.forEach(dbQuestion => {
            expect(dbQuestion).to.have.property('createdAt')
            expect(dbQuestion).to.have.property('updatedAt')
          })
        })
    })
  })
})
