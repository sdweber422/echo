/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint array-callback-return: "off"*/
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import getLatestFeedbackStats from 'src/server/actions/getLatestFeedbackStats'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach('Setup Survey Data', async function () {
    this.stats = {}

    await Promise.all(
      Object.values(STAT_DESCRIPTORS).map(async descriptor => {
        this.stats[descriptor] = await factory.create('stat', {descriptor})
      })
    )

    this.technicalHealthQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STAT_DESCRIPTORS.TECHNICAL_HEALTH].id,
    })

    this.cultureContributionQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STAT_DESCRIPTORS.CULTURE_CONTRIBUTION].id,
    })

    this.teamPlayQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STAT_DESCRIPTORS.TEAM_PLAY].id,
    })

    await this.buildSurvey([
      {questionId: this.technicalHealthQuestion.id, subjectIds: () => this.teamPlayerIds},
      {questionId: this.cultureContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
      {questionId: this.teamPlayQuestion.id, subjectIds: () => this.teamPlayerIds},
    ])

    const [subjectId, respondentId] = this.teamPlayerIds

    this.subjectId = subjectId
    this.respondentId = respondentId
  })

  it('returns the response values', async function () {
    await _createResponses(this, {tech: 3, culture: 4, teamPlay: 5})
    return expect(getLatestFeedbackStats({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq({
      [STAT_DESCRIPTORS.TECHNICAL_HEALTH]: 3,
      [STAT_DESCRIPTORS.CULTURE_CONTRIBUTION]: 4,
      [STAT_DESCRIPTORS.TEAM_PLAY]: 5,
    })
  })

  it('returns undefined when no feedback available', function () {
    return expect(getLatestFeedbackStats({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq(undefined)
  })

  it('returns undefined for individual stats if they\'re nor available', async function () {
    await _createResponses(this, {tech: 3})
    return expect(getLatestFeedbackStats({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq({[STAT_DESCRIPTORS.TECHNICAL_HEALTH]: 3})
  })
})

function _createResponses(test, values) {
  const {
    respondentId,
    subjectId,
    technicalHealthQuestion,
    cultureContributionQuestion,
    teamPlayQuestion,
  } = test

  const surveyId = test.survey.id

  const responses = []

  if ({}.hasOwnProperty.call(values, 'tech')) {
    responses.push({
      questionId: technicalHealthQuestion.id, surveyId, respondentId, subjectId, value: values.tech
    })
  }

  if ({}.hasOwnProperty.call(values, 'culture')) {
    responses.push({
      questionId: cultureContributionQuestion.id, surveyId, respondentId, subjectId, value: values.culture
    })
  }

  if ({}.hasOwnProperty.call(values, 'teamPlay')) {
    responses.push({
      questionId: teamPlayQuestion.id, surveyId, respondentId, subjectId, value: values.teamPlay
    })
  }

  return factory.createMany('response', responses)
}
