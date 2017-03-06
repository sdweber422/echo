/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'

import assertSurveyIsComplete from '../assertSurveyIsComplete'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildOneQuestionSurvey()

  describe('when a question has a response', function () {
    beforeEach(function () {
      return this.buildOneQuestionSurvey({
        questionAttrs: {subjectType: 'player', responseType: 'text'},
        subjectIds: () => [this.project.playerIds[1]]
      })
    })

    it('returns a rejected promise when a response is missing', async function () {
      expect(
        assertSurveyIsComplete(this.survey.id, this.project.playerIds[0])
      ).to.be.rejectedWith(/Missing survey responses/)
    })

    it('returns survey when all questions have been answered', async function () {
      const respondentId = this.project.playerIds[0]
      await factory.create('response', {
        respondentId,
        subjectId: this.project.playerIds[1],
        surveyId: this.survey.id,
        questionId: this.survey.questionRefs[0].questionId,
        value: 'some value',
      })
      const result = await assertSurveyIsComplete(this.survey.id, respondentId)
      expect(result.id).to.eq(this.survey.id)
    })
  })
})
