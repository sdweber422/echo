/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../query'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getRetrospectiveSurvey', function () {
    useFixture.buildSurvey()

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

      const results = await runGraphQLQuery(
        `query {
          getRetrospectiveSurvey {
            id
            cycle { id }
            project { id }
            questions {
              ... on SingleSubjectSurveyQuestion {
                id subject subjectType type body
              }
              ... on MultiSubjectSurveyQuestion {
                id subject subjectType type body
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
