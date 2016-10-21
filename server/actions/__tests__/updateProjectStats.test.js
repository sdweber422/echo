/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, comma-spacing, no-multi-spaces */
/* eslint key-spacing: [2, { "mode": "minimum" }] */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {getPlayerById} from 'src/server/db/player'
import {findQuestionsByStat} from 'src/server/db/question'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

import updateProjectStats from 'src/server/actions/updateProjectStats'

describe(testContext(__filename), function () {
  describe('updateProjectStats', function () {
    withDBCleanup()
    this.timeout(5000)
    useFixture.buildSurvey()

    beforeEach('Setup Survey Data', async function () {
      await reloadSurveyAndQuestionData()
      const getQ = descriptor => findQuestionsByStat(descriptor).filter({active: true})(0)
      const learningSupportQuestion      = await getQ(STAT_DESCRIPTORS.LEARNING_SUPPORT)
      const cultureContributionQuestion  = await getQ(STAT_DESCRIPTORS.CULTURE_CONTRIBUTION)
      const teamPlayQuestion             = await getQ(STAT_DESCRIPTORS.TEAM_PLAY)
      const projectHoursQuestion         = await getQ(STAT_DESCRIPTORS.PROJECT_HOURS)
      const relativeContributionQuestion = await getQ(STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION)

      await this.buildSurvey([
        {questionId: learningSupportQuestion.id     , subjectIds: () => this.teamPlayerIds},
        {questionId: cultureContributionQuestion.id , subjectIds: () => this.teamPlayerIds},
        {questionId: teamPlayQuestion.id            , subjectIds: () => this.teamPlayerIds},
        {questionId: relativeContributionQuestion.id, subjectIds: () => this.teamPlayerIds},
        {questionId: projectHoursQuestion.id        , subjectIds: () => this.project.id},
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
        xp: 28,
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
            xp: 28,
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
