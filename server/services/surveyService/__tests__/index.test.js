/* eslint-env mocha */
/* global testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import faker from 'faker'
import factory from 'src/test/factories'
import {sortByAttrs} from 'src/common/util'
import {
  expectArraysToContainTheSameElements,
  resetDB,
  useFixture
} from 'src/test/helpers'

import {getStatResponsesBySubjectId} from '../index'

describe(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(resetDB)

  describe('getStatResponsesBySubjectId()', function () {
    it('returns the response information for the stat questions for the given subject', async function () {
      const stats = await factory.createMany('stat', [
        {descriptor: 'stat1'},
        {descriptor: 'stat2'},
      ])
      const questions = await factory.createMany('question', stats.map(_ => ({statId: _.id})))
      const subjectId = faker.random.uuid()
      const questionRefs = stats.map((stat, i) => ({subjectIds: [subjectId], questionId: questions[i].id}))

      await this.buildSurvey({questionRefs})

      this.saveResponses = (respondentId, values) => {
        return factory.createMany('response', stats.map((stat, i) => ({
          surveyId: this.survey.id,
          value: values[i],
          questionId: questions[i].id,
          subjectId,
          respondentId,
        })))
      }

      const [p1, p2] = [faker.random.uuid(), faker.random.uuid()]
      await this.saveResponses(p1, [1, 2])
      await this.saveResponses(p2, [3, 4])

      const result = await getStatResponsesBySubjectId(subjectId)

      expectArraysToContainTheSameElements(sortByAttrs(result, 'value'), sortByAttrs([
        {statDescriptor: 'stat1', respondentId: p1, value: 1, subjectId},
        {statDescriptor: 'stat2', respondentId: p1, value: 2, subjectId},
        {statDescriptor: 'stat1', respondentId: p2, value: 3, subjectId},
        {statDescriptor: 'stat2', respondentId: p2, value: 4, subjectId},
      ], 'value'))
    })
  })
})
