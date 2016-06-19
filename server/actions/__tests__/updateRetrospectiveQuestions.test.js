/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import updateRetrospectiveQuestions from '../updateRetrospectiveQuestions'
import {getRetrospectiveSurveyBlueprint} from '../../db/surveyBlueprint'

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
          expect(surveyBlueprint.defaultQuestionIds).to.deep.equal(questionIds)
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
})
