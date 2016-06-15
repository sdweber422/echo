/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressionsi, max-nested-callbacks */
import r from '../../../db/connect'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {PRACTICE} from '../../../common/models/cycle'
import {parseQueryError} from '../../../server/db/errors'

import {
  getFullRetrospectiveSurveyForPlayer,
  getRetrospectiveSurveyForPlayer,
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

    it('adds a questions array with subjects and responseIntructions', function () {
      return getFullRetrospectiveSurveyForPlayer(this.teamPlayerIds[0])
        .then(result => {
          expect(result).to.have.property('questions').with.length(this.survey.questionRefs.length)
          result.questions.forEach(question => expect(question).to.have.property('subject'))
          result.questions.forEach(question => expect(question).to.have.property('responseIntructions'))
        })
    })

    describe('when no reflection cycle exists', function () {
      beforeEach(function () {
        return r.table('cycles').get(this.survey.cycleId).update({state: PRACTICE})
      })

      it('rejects the promise with an appropriate error', async function () {
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
        return r.table('projects').get(this.survey.projectId).delete()
      })

      it('rejects the promise with an appropriate error', async function () {
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
        return r.table('surveys').get(this.survey.id).delete()
      })

      it('rejects the promise with an appropriate error', async function () {
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
