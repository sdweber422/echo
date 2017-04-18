/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture, mockIdmUsersById} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  describe('Retrospective queries', function () {
    beforeEach('Setup Retrospective Survey Data', async function () {
      const teamQuestion = await factory.create('question', {
        responseType: 'relativeContribution',
        subjectType: 'team'
      })
      const playerQuestion = await factory.create('question', {
        body: 'What is one thing {{subject}} did well?',
        responseType: 'text',
        subjectType: 'player'
      })
      await this.buildSurvey([
        {questionId: teamQuestion.id, subjectIds: () => this.project.playerIds},
        {questionId: playerQuestion.id, subjectIds: () => [this.project.playerIds[1]]},
      ])
      this.currentUser = await factory.build('user', {id: this.project.playerIds[0]})
      await mockIdmUsersById(this.project.playerIds)
    })

    afterEach(function () {
      nock.cleanAll()
    })

    it('gets a single question from the survey by index', async function () {
      const questionNumber = 2 // <-- 1-based arg
      const questionIndex = 1 // <-- 0-based index
      const result = await runGraphQLQuery(
        `query($questionNumber: Int!) {
          getRetrospectiveSurveyQuestion(questionNumber: $questionNumber) {
            id subjectType responseType body
            subjects { id name handle }
          }
        }
        `,
        fields,
        {questionNumber},
        {currentUser: this.currentUser}
      )
      expect(result.data.getRetrospectiveSurveyQuestion)
        .to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
    })

    it('accepts a projectName parameter', async function () {
      const questionNumber = 2 // <-- 1-based arg
      const questionIndex = 1 // <-- 0-based index
      const result = await runGraphQLQuery(
        `query($questionNumber: Int!, $projectName: String) {
          getRetrospectiveSurveyQuestion(questionNumber: $questionNumber, projectName: $projectName) {
            id
          }
        }
        `,
        fields,
        {questionNumber, projectName: this.project.name},
        {currentUser: this.currentUser}
      )
      expect(result.data.getRetrospectiveSurveyQuestion)
        .to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
    })
  })
})
