/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {getPlayerById} from '../../../server/db/player'

import {updateProjectStats} from '../updateProjectStats'

describe(testContext(__filename), function () {
  describe('updateProjectStats', function () {
    withDBCleanup()
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      const learningSupportQuestion = await factory.create('question', {
        responseType: 'likert7Agreement',
        subjectType: 'player',
        body: 'so-and-so supported me in learning my craft.',
      })

      const cultureContributionQuestion = await factory.create('question', {
        responseType: 'likert7Agreement',
        subjectType: 'player',
        body: 'so-and-so contributed positively to our team culture.',
      })

      const projectHoursQuestion = await factory.create('question', {
        responseType: 'text',
        subjectType: 'project',
        body: 'During this past cycle, how many hours did you dedicate to this project?'
      })

      const relativeContributionQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })

      await this.buildSurvey([
        {questionId: learningSupportQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: cultureContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: relativeContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: projectHoursQuestion.id, subjectIds: () => this.project.id},
      ])

      const responseData = []
      this.teamPlayerIds.forEach(respondentId => {
        this.teamPlayerIds.forEach(subjectId => {
          responseData.push({
            questionId: relativeContributionQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 20,
          })

          responseData.push({
            questionId: learningSupportQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 5,
          })

          responseData.push({
            questionId: cultureContributionQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 7,
          })
        })

        responseData.push({
          questionId: projectHoursQuestion.id,
          surveyId: this.survey.id,
          respondentId,
          subjectId: this.project.id,
          value: '35',
        })
      })

      await factory.createMany('response', responseData)
    })

    it('updates the players\' stats based on the survey responses', async function() {
      const expectedECC = 20 * this.teamPlayerIds.length
      await updateProjectStats(this.project, this.cycleId)

      const updatedPlayer = await getPlayerById(this.teamPlayerIds[0])

      expect(updatedPlayer.stats).to.deep.eq({
        ecc: expectedECC,
        projects: {
          [this.project.id]: {
            cycles: {
              [this.cycleId]: {
                ls: 67,
                cc: 100,
                ec: 25,
                ecd: -5,
                abc: 4,
                rc: 20,
                ecc: expectedECC,
                hours: 35,
              },
            },
          },
        },
      })
    })
  })
})
