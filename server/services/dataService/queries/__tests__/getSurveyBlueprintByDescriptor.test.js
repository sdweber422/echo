/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import getSurveyBlueprintByDescriptor from '../getSurveyBlueprintByDescriptor'

describe(testContext(__filename), function () {
  withDBCleanup()

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
