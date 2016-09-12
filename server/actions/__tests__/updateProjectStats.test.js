/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {getPlayerById} from 'src/server/db/player'

import updateProjectStats from 'src/server/actions/updateProjectStats'

describe(testContext(__filename), function () {
  describe('updateProjectStats', function () {
    withDBCleanup()
    this.timeout(5000)
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

      const teamPlayQuestion = await factory.create('question', {
        responseType: 'likert7Agreement',
        subjectType: 'player',
        body: 'Independent of their coding skills, so-and-so participated on our project as a world class team player.',
      })

      const projectHoursQuestion = await factory.create('question', {
        responseType: 'numeric',
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
        {questionId: teamPlayQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: relativeContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: projectHoursQuestion.id, subjectIds: () => this.project.id},
      ])

      const responseData = []
      this.teamPlayerIds.forEach(respondentId => {
        this.teamPlayerIds.forEach(subjectId => {
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

          responseData.push({
            questionId: teamPlayQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 6,
          })

          responseData.push({
            questionId: relativeContributionQuestion.id,
            surveyId: this.survey.id,
            respondentId,
            subjectId,
            value: 20,
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
      const playerId = this.teamPlayerIds[0]
      const playerEloRating = 1300

      await getPlayerById(playerId).update({stats: {elo: {rating: playerEloRating}}}).run()
      await updateProjectStats(this.project, this.cycleId)

      const expectedECC = 20 * this.teamPlayerIds.length
      const updatedPlayer = await getPlayerById(playerId)

      expect(updatedPlayer.stats).to.deep.eq({
        ecc: expectedECC,
        elo: {
          rating: 1204,
          matches: 3,
        },
        projects: {
          [this.project.id]: {
            ls: 67,
            cc: 100,
            tp: 83,
            ec: 25,
            ecd: -5,
            abc: 4,
            rc: 20,
            rcSelf: 20,
            rcOther: 20,
            rcPerHour: 0.57, // 35 hours / 20% RC
            hours: 35,
            teamHours: 140,
            ecc: expectedECC,
            elo: {
              rating: 1204,
              matches: 3,
              score: 0.57,
              kFactor: 100,
            }
          },
        },
      })
    })
  })
})

/**
 * Test match results:
 *
 *   1300  1000  1000  1000
 *   a     b     c     d
 *   --------------------------------------
 *   1300, 1000 =  1265, 1035
 *   a     b       a     b
 *   --------------------------------------
 *   1300, 1000 -> 1265, 1000 =  1233, 1032
 *   a     c       a     c       a     c
 *   --------------------------------------
 *   1300, 1000 -> 1233, 1000 =  1204, 1029
 *   a     d       a     d       a     d
 *   --------------------------------------
 *   1000, 1000 -> 1035, 1032 =  1035, 1032
 *   b     c       b     c       b     c
 *   --------------------------------------
 *   1000, 1000 -> 1035, 1029 =  1034, 1030
 *   b     d       b     d       b     d
 *   --------------------------------------
 *   1000, 1000 -> 1032, 1030 =  1032, 1030
 *   c     d       c     d       c     d
 *   --------------------------------------
 *   1204  1034  1032  1030
 *   a     b     c     d
*/
