/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {truncateDBTables, useFixture} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import findProjectEvaluations from '../findProjectEvaluations'

describe(testContext(__filename), function () {
  before(truncateDBTables)

  before(async function () {
    useFixture.nockClean()
    useFixture.createProjectReviewSurvey()
    this.players = await factory.createMany('player', 5)
  })

  it('returns correct evaluations for project', async function () {
    await this.createProjectReviewSurvey()

    const sortedPlayers = this.players.sort((p1, p2) => p1.id.localeCompare(p2.id))

    await Promise.mapSeries(sortedPlayers, (player, i) => {
      const response = {surveyId: this.survey.id, respondentId: player.id, subjectId: this.project.id}
      return Promise.all([
        factory.create('response', {...response, questionId: this.questionCompleteness.id, value: 80 + i}),
        factory.create('response', {...response, questionId: this.questionQuality.id, value: 90 + i}),
      ])
    })

    const evaluations = await findProjectEvaluations(this.project.id)
    const sortedEvaluations = evaluations.sort((r1, r2) => r1.submittedById.localeCompare(r2.submittedById))

    expect(evaluations.length).to.eq(sortedPlayers.length)

    sortedEvaluations.forEach((evaluation, i) => {
      expect(evaluation.submittedById).to.eq(sortedPlayers[i].id)
      expect(evaluation[STAT_DESCRIPTORS.PROJECT_COMPLETENESS]).to.eq(80 + i)
      expect(evaluation[STAT_DESCRIPTORS.PROJECT_QUALITY]).to.eq(90 + i)
    })
  })
})
