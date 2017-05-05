/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'
import {useFixture} from 'src/test/helpers/fixtures'

import findProjectReviewsForPlayer from '../findProjectReviewsForPlayer'

describe(testContext(__filename), function () {
  useFixture.createProjectReviewSurvey()

  beforeEach(resetDB)

  it('finds the project reviews for the given player', async function () {
    await this.createProjectReviewSurvey()
    const user = await factory.build('user')
    const respondent = await factory.create('player', {id: user.id})
    await factory.create('response', {
      value: 85,
      subjectId: this.project.id,
      questionId: this.questionCompleteness.id,
      respondentId: user.id,
      surveyId: this.survey.id,
    })

    const reviews = await findProjectReviewsForPlayer(respondent.id)

    expect(reviews.length).to.equal(1)
    expect(reviews[0].completeness).to.equal(85)
    expect(reviews[0].projectId).to.equal(this.project.id)
    expect(reviews[0].projectName).to.equal(this.project.name)
  })
})
