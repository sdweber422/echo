/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  saveQuestion,
  getQuestionById,
  questionsTable,
  findQuestionsByStat,
} from 'src/server/db/question'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveQuestion()', function () {
    beforeEach(function () {
      return factory.create('question')
        .then(question => {
          this.question = question
        })
    })

    it('updates existing record when id provided', function () {
      const updatedQuestion = Object.assign({}, this.question, {newAttr: 'newVal'})
      return saveQuestion(updatedQuestion)
        .then(() => getQuestionById(this.question.id))
        .then(savedRecord => expect(savedRecord).to.have.property('newAttr', 'newVal'))
    })

    it('saves a new record when new id provided', async function () {
      const newQuestion = await factory.build('question')
      await saveQuestion(newQuestion)
      const count = await questionsTable.count()
      expect(count).to.eq(2)
    })
  })

  describe('findQuestionsByStat()', function () {
    beforeEach(async function () {
      this.stat1 = await factory.create('stat')
      this.stat2 = await factory.create('stat')

      this.stat1Questions = await factory.createMany('question', {statId: this.stat1.id}, 3)
      this.stat2Questions = await factory.createMany('question', {statId: this.stat2.id}, 3)
      this.noStatQuestions = await factory.create('question')
    })

    it('returns the matching questions', async function () {
      const foundStat1QuestionIds = await findQuestionsByStat(this.stat1.descriptor)
      expect(foundStat1QuestionIds.map(_ => _.id).sort())
        .to.deep.eq(this.stat1Questions.map(_ => _.id).sort())

      const foundStat2QuestionIds = await findQuestionsByStat(this.stat2.descriptor)
      expect(foundStat2QuestionIds.map(_ => _.id).sort())
        .to.deep.eq(this.stat2Questions.map(_ => _.id).sort())
    })
  })
})
