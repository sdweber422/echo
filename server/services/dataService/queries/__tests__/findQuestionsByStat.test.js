/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

import findQuestionsByStat from '../findQuestionsByStat'

describe(testContext(__filename), function () {
  beforeEach(resetDB)
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
