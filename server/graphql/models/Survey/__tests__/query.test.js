/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'
import fields from '../query'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach('Setup Survey Data', async function () {
    try {
      const teamQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })
      const playerQuestion = await factory.create('question', {
        body: 'What is one thing <player> did well?',
        responseType: 'text',
        subjectType: 'player'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subject: () => this.teamPlayerIds},
        {questionId: playerQuestion.id, subject: () => this.teamPlayerIds[1]},
      ])
      this.currentUser = await factory.build('user', {id: this.teamPlayerIds[0]})

      const idmUsers = await Promise.all(this.teamPlayerIds.map(id => factory.build('user', {id})))
      nock(process.env.IDM_BASE_URL)
        .post('/graphql')
        .reply(200, JSON.stringify({data: {getUsersByIds: idmUsers}}))
    } catch (e) {
      throw (e)
    }
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('getRetrosoectiveSurveyQuestion', function () {
    it('gets a single question from the survey by index', function () {
      const questionNumber = 2 // <-- 1-based arg
      const questionIndex = 1 // <-- 0-based index

      return runGraphQLQuery(
        `query($questionNumber: Int!) {
          getRetrospectiveSurveyQuestion(questionNumber: $questionNumber) {
            ... on SurveyQuestionInterface {
              id subjectType responseType body
            }
            ... on SinglePartSubjectSurveyQuestion {
              subject { id name handle }
            }
            ... on MultiPartSubjectSurveyQuestion {
              subject { id name handle }
            }
          }
        }
        `,
        fields,
        {questionNumber},
        {currentUser: this.currentUser}
      ).then(result =>
        expect(result.data.getRetrospectiveSurveyQuestion)
          .to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
      )
    })
  })

  describe('getRetrospectiveSurvey', function () {
    it('returns the survey for the correct cycle and project for the current user', function () {
      return runGraphQLQuery(
        `query {
          getRetrospectiveSurvey {
            id
            cycle { id }
            project { id }
            questions {
              ... on SurveyQuestionInterface {
                id subjectType responseType body
              }
              ... on SinglePartSubjectSurveyQuestion {
                subject { id name handle }
              }
              ... on MultiPartSubjectSurveyQuestion {
                subject { id name handle }
              }
            }
          }
        }
        `,
        fields,
        undefined,
        {currentUser: this.currentUser}
      ).then(result =>
        expect(result.data.getRetrospectiveSurvey.id).to.eq(this.survey.id)
      )
    })

    it('returns a meaningful error when lookup fails', function () {
      return r.table('surveys').get(this.survey.id).delete()
        .then(() => expect(
          runGraphQLQuery('query { getRetrospectiveSurvey { id } }',
            fields,
            undefined,
            {currentUser: this.currentUser}
          )
        ).to.be.rejectedWith(/no retrospective survey/))
    })
  })
})
