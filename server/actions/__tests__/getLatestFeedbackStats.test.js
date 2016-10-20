/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint array-callback-return: "off"*/
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {STATS_QUESTION_TYPES} from 'src/server/util/survey'

import getLatestFeedbackStats from 'src/server/actions/getLatestFeedbackStats'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach('Setup Survey Data', async function () {
    this.stats = {}

    await Promise.all(
      Object.values(STATS_QUESTION_TYPES).map(async descriptor => {
        this.stats[descriptor] = await factory.create('stat', {descriptor})
      })
    )

    this.learningSupportQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STATS_QUESTION_TYPES.LEARNING_SUPPORT].id,
      body: 'so-and-so supported me in learning my craft.',
    })

    this.cultureContributionQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION].id,
      body: 'so-and-so contributed positively to our team culture.',
    })

    this.teamPlayQuestion = await factory.create('question', {
      responseType: 'likert7Agreement',
      subjectType: 'player',
      statId: this.stats[STATS_QUESTION_TYPES.TEAM_PLAY].id,
      body: 'Independent of their coding skills, so-and-so participated on our project as a world class team player.',
    })

    await this.buildSurvey([
      {questionId: this.learningSupportQuestion.id, subjectIds: () => this.teamPlayerIds},
      {questionId: this.cultureContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
      {questionId: this.teamPlayQuestion.id, subjectIds: () => this.teamPlayerIds},
    ])

    const [subjectId, respondentId] = this.teamPlayerIds

    this.subjectId = subjectId
    this.respondentId = respondentId
  })

  it('returns the response values', async function () {
    await _createResponses(this, {learning: 3, culture: 4, teamPlay: 5})
    return expect(getLatestFeedbackStats({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq({
      [STATS_QUESTION_TYPES.LEARNING_SUPPORT]: 3,
      [STATS_QUESTION_TYPES.CULTURE_CONTRIBUTION]: 4,
      [STATS_QUESTION_TYPES.TEAM_PLAY]: 5,
    })
  })

  it('undefined when no feedback available', function () {
    return expect(getLatestFeedbackStats({subjectId: this.subjectId, respondentId: this.respondentId})).to.eventually.deep.eq(undefined)
  })
})

function _createResponses(test, {learning, culture, teamPlay}) {
  const {
    respondentId,
    subjectId,
    learningSupportQuestion,
    cultureContributionQuestion,
    teamPlayQuestion,
  } = test

  const surveyId = test.survey.id

  return factory.createMany('response', [
    {questionId: learningSupportQuestion.id, surveyId, respondentId, subjectId, value: learning},
    {questionId: cultureContributionQuestion.id, surveyId, respondentId, subjectId, value: culture},
    {questionId: teamPlayQuestion.id, surveyId, respondentId, subjectId, value: teamPlay},
  ])
}
