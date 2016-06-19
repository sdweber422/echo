/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {
  getSurveyBlueprintByDescriptor,
  saveSurveyBlueprint,
  getSurveyBlueprintById,
  surveysBluprintsTable,
} from '../surveyBlueprint'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getSurveyBlueprintByDescriptor()', function () {
    beforeEach(function () {
      return factory.create('surveyBlueprint', {descriptor: 'myDescriptor'})
        .then(surveyBlueprint => {
          this.surveyBlueprint = surveyBlueprint
        })
    })

    it('returns the correct surveyBlueprint', function () {
      return expect(
        getSurveyBlueprintByDescriptor('myDescriptor')
      ).to.eventually.deep.eq(this.surveyBlueprint)
    })
  })

  describe('saveSurveyBlueprint()', function () {
    beforeEach(function () {
      return factory.create('surveyBlueprint', {descriptor: 'myDescriptor'})
        .then(surveyBlueprint => {
          this.surveyBlueprint = surveyBlueprint
        })
    })

    it('updates existing record when id provided', function () {
      const updatedSurveyBlueprint = Object.assign({}, this.surveyBlueprint, {newAttr: 'newVal'})
      return saveSurveyBlueprint(updatedSurveyBlueprint)
        .then(() => getSurveyBlueprintById(this.surveyBlueprint.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('updates existing record when id missing but descriptor provided', function () {
      const updatedSurveyBlueprint = Object.assign({}, this.surveyBlueprint, {newAttr: 'newVal'})
      delete updatedSurveyBlueprint.id
      return saveSurveyBlueprint(updatedSurveyBlueprint)
        .then(() => getSurveyBlueprintById(this.surveyBlueprint.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new descriptor provided', async function () {
      try {
        const newSurveyBlueprint = await factory.build('surveyBlueprint')
        delete newSurveyBlueprint.id
        await saveSurveyBlueprint(newSurveyBlueprint)
        const count = await surveysBluprintsTable.count()
        expect(count).to.eq(2)
      } catch (e) {
        throw e
      }
    })
  })
})
