/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint key-spacing: [2, { "mode": "minimum" }] */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import updatePlayerCumulativeStats from 'src/server/actions/updatePlayerCumulativeStats'
import {Player} from 'src/server/services/dataService'

describe(testContext(__filename), function () {
  describe('updatePlayerCumulativeStats', function () {
    withDBCleanup()
    useFixture.nockClean()
    useFixture.createProjectReviewSurvey()

    it('updates the player\'s cumulative stats based on the survey responses', async function () {
      await this.createProjectReviewSurvey()

      const players = await factory.createMany('player', 5)
      const sortedPlayers = players.sort((p1, p2) => p1.id.localeCompare(p2.id))

      await Promise.mapSeries(sortedPlayers, (player, i) => {
        const response = {surveyId: this.survey.id, respondentId: player.id, subjectId: this.project.id}
        return Promise.all([
          factory.create('response', {...response, questionId: this.questionCompleteness.id, value: 80 + i}),
          factory.create('response', {...response, questionId: this.questionQuality.id, value: 90 + i}),
        ])
      })

      await updatePlayerCumulativeStats(players[0].id)

      const player = await Player.get(players[0].id)
      expect(player.stats.numProjectsReviewed).to.equal(1)
    })
  })
})
