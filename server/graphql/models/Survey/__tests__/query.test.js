/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery} from '../../../../../test/helpers'
import {RETROSPECTIVE} from '../../../../../common/models/cycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getRetrospectiveSurvey', function () {
    it('returns the survey for the correct cycle and project for the current user', async function() {
      const player = await factory.create('player')
      const currentUser = await factory.build('user', {id: player.id})
      const cycle = await factory.create('cycle', {chapterId: player.chapterId, state: RETROSPECTIVE})
      const project = await factory.create('project', {
        chapterId: player.chapterId,
        cycleTeams: {[cycle.id]: {playerIds: [player.id]}}
      })
      const survey = await factory.create('survey', {projectId: project.id, cycleId: cycle.id})

      const results = await runGraphQLQuery(
        'query { getRetrospectiveSurvey { id } }',
        fields,
        undefined,
        {currentUser}
      )

      expect(results.data.getRetrospectiveSurvey.id).to.eq(survey.id)
    })
  })
})
