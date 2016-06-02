/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import factory from '../../../../../test/factories'
import r from '../../../../../db/connect'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'
import {RETROSPECTIVE, COMPLETE} from '../../../../../common/models/cycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveRetrospectiveCLISurveyResponse', function () {
    beforeEach(async function () {
      try {
        this.project = await factory.create('project')
        const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
        await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
        await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

        this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds
        this.currentUserId = this.teamPlayerIds[0]
        this.user = await factory.build('user', {id: this.currentUserId, roles: ['moderator']})
        this.question = await factory.create('question', {subjectType: 'team', type: 'percentage'})
        this.survey = await factory.build('survey', {
          cycleId,
          projectId: this.project.id,
          questions: [{questionId: this.question.id, subject: this.teamPlayerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
      } catch (e) {
        throw (e)
      }
      this.invokeAPI = function (responseParams = ['user1:25', 'user2:25', 'user3:25', 'user4:25']) {
        return runGraphQLMutation(
          `mutation($response: CLISurveyResponse!) {
            saveRetrospectiveCLISurveyResponse(response: $response)
            {
              createdIds
            }
          }`,
          fields,
          {
            response: {
              responseParams,
              questionNumber: 1,
            },
          },
          {currentUser: this.user},
        )
      }
    })

    it('returns new response ids for all responses created', function () {
      return this.invokeAPI()
        .then(result => expect(result.data.saveRetrospectiveCLISurveyResponse.createdIds).have.length(4))
    })
  })
})
