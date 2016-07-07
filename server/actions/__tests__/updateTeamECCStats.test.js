/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {getPlayerById} from '../../../server/db/player'

import {
  calculateProjectECCForPlayer,
  updateTeamECCStats,
} from '../updateTeamECCStats'

describe(testContext(__filename), function () {
  describe('calculateProjectECCForPlayer()', function () {
    specify('when there are scores from all team members', function () {
      expect(calculateProjectECCForPlayer({teamSize: 4, relativeContributionScores: [10, 20, 20, 30]}))
        .to.eq(80)
    })
    specify('when there are not scores from all team members', function () {
      expect(calculateProjectECCForPlayer({teamSize: 4, relativeContributionScores: [20, 25, 30]}))
        .to.eq(100)
    })
    specify('when the result is over 100', function () {
      expect(calculateProjectECCForPlayer({teamSize: 4, relativeContributionScores: [50, 50, 50, 50]}))
        .to.eq(200)
    })
    specify('when the result is a decimal', function () {
      expect(calculateProjectECCForPlayer({teamSize: 5, relativeContributionScores: [10, 10, 21, 21]}))
        .to.eq(77.5)
    })
  })

  describe('updateTeamECCStats', function () {
    withDBCleanup()
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      const teamQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subject: () => this.teamPlayerIds},
      ])
      const responseData = []
      this.teamPlayerIds.forEach(respondentId => {
        this.teamPlayerIds.forEach(subject => {
          responseData.push({
            questionId: teamQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subject,
            value: 20
          })
        })
      })
      await factory.createMany('response', responseData)
    })

    it('updates the players ECC based on the survey responses', async function() {
      const eccChange = 20 * this.teamPlayerIds.length
      await updateTeamECCStats(this.project, this.cycleId)

      const updatedPlayer = await getPlayerById(this.teamPlayerIds[0])
      expect(updatedPlayer.ecc).to.eq(eccChange)
      expect(updatedPlayer).to.have.property('cycleProjectECC')
        .deep.eq({
          [this.cycleId]: {[this.project.id]: eccChange}
        })
    })
  })
})
