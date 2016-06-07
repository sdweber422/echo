/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'
import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getRetrospectiveSurvey', function () {
    useFixture.buildSurvey()

    afterEach(function () {
      nock.cleanAll()
    })

    it('returns the survey for the correct cycle and project for the current user', async function() {
      const teamQuestion = await factory.create('question', {
        type: 'percentage',
        subjectType: 'team'
      })
      const playerQuestion = await factory.create('question', {
        body: 'What is one thing <player> did well?',
        type: 'text',
        subjectType: 'player'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subject: () => this.teamPlayerIds},
        {questionId: playerQuestion.id, subject: () => this.teamPlayerIds[1]},
      ])
      const currentUser = await factory.build('user', {id: this.teamPlayerIds[0]})

      const idmUsers = await Promise.all(this.teamPlayerIds.map(id => factory.build('user', {id})))

      nock(process.env.IDM_BASE_URL)
        .post('/graphql')
        .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))

      const results = await runGraphQLQuery(
        `query {
          getRetrospectiveSurvey {
            id
            cycle { id }
            project { id }
            questions {
              ... on SingleSubjectSurveyQuestion {
                id subjectType type body
                subject {
                  id
                  name
                  handle
                }
              }
              ... on MultiSubjectSurveyQuestion {
                id subjectType type body
                subject {
                  id
                  name
                  handle
                }
              }
            }
          }
        }
        `,
        fields,
        undefined,
        {currentUser}
      )

      expect(results.data.getRetrospectiveSurvey.id).to.eq(this.survey.id)
    })
  })
})
