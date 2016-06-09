/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {withDBCleanup, useFixture} from '../../../test/helpers'

import {
  getFullRetrospectiveSurveyForPlayer,
  getRetrospectiveSurveyForPlayer
} from '../survey'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  describe('getRetrospectiveSurveyForPlayer()', function () {
    beforeEach(async function () {
      return this.buildSurvey()
    })

    it('returns the correct survey', function () {
      return expect(
        getRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
      ).to.eventually.deep.eq(this.survey)
    })
  })

  describe('getFullRetrospectiveSurveyForPlayer()', function () {
    beforeEach(async function () {
      return this.buildSurvey()
    })

    it('adds a thin project and cycle', function () {
      return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
        .then(result => {
          expect(result).to.have.deep.property('cycle.id', this.survey.cycleId)
          expect(result).to.have.deep.property('project.id', this.survey.projectId)
        })
    })

    it('adds a questions array', function () {
      return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
        .then(result => {
          expect(result).to.have.property('questions').with.length(this.survey.questionRefs.length)
          result.questions.forEach(question => expect(question).to.have.property('subject'))
        })
    })
  })
})
