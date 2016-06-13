/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import nock from 'nock'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  useFixture.buildOneQuestionSurvey()

  describe('saveRetrospectiveCLISurveyResponse', function () {
    beforeEach(async function () {
      try {
        await this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team', type: 'relativeContribution'},
          subject: () => this.teamPlayerIds
        })
        this.user = await factory.build('user', {id: this.teamPlayerIds[0]})

        this.teamHandles = ['bob', 'alice', 'steve', 'shereef']
        nock(process.env.IDM_BASE_URL)
          .persist()
          .post('/graphql')
          .reply(200, JSON.stringify({
            data: {
              getUsersByHandles: this.teamHandles.map(
                (handle, i) => ({handle, id: this.teamPlayerIds[i]})
              )
            }
          }))
      } catch (e) {
        throw (e)
      }

      this.invokeAPI = function (responseParams = ['bob:25', 'alice:25', 'steve:25', 'shereef:25']) {
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

    afterEach(function () {
      nock.cleanAll()
    })

    it('returns new response ids for all responses created', function () {
      return this.invokeAPI()
        .then(result => expect(result.data.saveRetrospectiveCLISurveyResponse.createdIds).have.length(4))
    })

    it('returns helpful error messages when missing parts', function () {
      return expect(
        this.invokeAPI(['invalid'])
      ).to.be.rejectedWith(/Expected this response to have \d parts/)
    })

    it('returns helpful error messages for invalid values', function () {
      return expect(
        this.invokeAPI(['bob:101'])
      ).to.be.rejectedWith(/must be less than or equal to 100/)
    })
  })
})
