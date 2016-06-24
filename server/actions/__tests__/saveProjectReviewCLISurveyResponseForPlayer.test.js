/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {setRetrospectiveSurveyForCycle, getCycleIds} from '../../../server/db/project'
import {withDBCleanup} from '../../../test/helpers'

import {saveProjectReviewCLISurveyResponseForPlayer} from '../saveRetrospectiveCLISurveyResponseForPlayer'

describe.skip(testContext(__filename), function () {
  withDBCleanup()

  // useFixture.buildOneQuestionSurvey()

  describe('answering all questions at once', function () {
    beforeEach(async function () {
      try {
        this.questionA = await factory.create('question', {responseType: 'percentage', subjectType: 'project'})
        this.questionB = await factory.create('question', {responseType: 'percentage', subjectType: 'project'})
        this.project = await factory.create('project')
        this.cycleId = getCycleIds(this.project)[0]
        this.survey = await factory.create('survey', {
          cycleId: this.cycleId,
          projectId: this.project.id,
          questionRefs: [
            {name: 'A', questionId: this.questionA.id, subject: this.project.id},
            {name: 'B', questionId: this.questionA.id, subject: this.project.id},
          ]
        })
        await setRetrospectiveSurveyForCycle(this.project.id, this.cycleId, this.survey.id)
      } catch (e) {
        throw (e)
      }
    })

    it('saves the responses with the right attributes', async function () {
      try {
        await saveProjectReviewCLISurveyResponseForPlayer(this.currentUserId, this.project.id, {
          A: '80',
          B: '75',
        })

        const responses = await r.table('responses').run()
        expect(responses.length).to.eq(2)
        expect(responses.find(response => response.questionId === this.questionA))
          .to.have.property('value', 75)
        expect(responses.find(response => response.questionId === this.questionB))
          .to.have.property('value', 80)
        responses.forEach(response => {
          expect(response).to.have.property('surveyId', this.survey.id)
          expect(response).to.have.property('respondentId', this.currentUserId)
          expect(response.subject).to.eq(this.project.id)
        })
      } catch (e) {
        throw (e)
      }
    })
  })
})
