/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {setProjectReviewSurveyForCycle, getCycleIds} from '../../../server/db/project'
import {getCycleById} from '../../../server/db/cycle'
import {withDBCleanup, expectArraysToContainTheSameElements} from '../../../test/helpers'

import saveProjectReviewCLISurveyResponsesForPlayer from '../saveProjectReviewCLISurveyResponsesForPlayer'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(async function () {
    try {
      this.questionA = await factory.create('question', {responseType: 'percentage', subjectType: 'project'})
      this.questionB = await factory.create('question', {responseType: 'percentage', subjectType: 'project'})
      this.project = await factory.create('project')
      const cycleIds = await getCycleIds(this.project)
      this.cycle = await getCycleById(cycleIds[cycleIds.length - 1])
      this.survey = await factory.create('survey', {
        questionRefs: [
          {name: 'A', questionId: this.questionA.id, subject: this.project.id},
          {name: 'B', questionId: this.questionB.id, subject: this.project.id},
        ]
      })
      await setProjectReviewSurveyForCycle(this.project.id, this.cycle.id, this.survey.id)

      const player = await factory.create('player', {chapterId: this.cycle.chapterId})
      this.currentUser = await factory.build('user', {id: player.id})
    } catch (e) {
      throw (e)
    }
  })

  describe('answering one at a time', function () {
    it('saves the responses with the right attributes', async function () {
      const result1 = await saveProjectReviewCLISurveyResponsesForPlayer(this.currentUser.id, this.project.name, {A: '80'})
      const result2 = await saveProjectReviewCLISurveyResponsesForPlayer(this.currentUser.id, this.project.name, {B: '75'})

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)

      const response1 = responses.find(({id}) => id === result1[0])
      const response2 = responses.find(({id}) => id === result2[0])

      expect(response1).to.have.property('value', 80)
      expect(response1).to.have.property('questionId', this.questionA.id)
      expect(response2).to.have.property('value', 75)
      expect(response2).to.have.property('questionId', this.questionB.id)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('respondentId', this.currentUser.id)
        expect(response.subject).to.eq(this.project.id)
      })
    })
  })

  describe('answering all questions at once', function () {
    it('saves the responses with the right attributes', async function () {
      const result = await saveProjectReviewCLISurveyResponsesForPlayer(this.currentUser.id, this.project.name, {
        A: '80',
        B: '75',
      })

      const responses = await r.table('responses').run()
      expect(responses.length).to.eq(2)
      expectArraysToContainTheSameElements(result, responses.map(({id}) => id))
      expect(responses.find(response => response.questionId === this.questionA.id))
        .to.have.property('value', 80)
      expect(responses.find(response => response.questionId === this.questionB.id))
        .to.have.property('value', 75)
      responses.forEach(response => {
        expect(response).to.have.property('surveyId', this.survey.id)
        expect(response).to.have.property('respondentId', this.currentUser.id)
        expect(response.subject).to.eq(this.project.id)
      })
    })
  })
})
