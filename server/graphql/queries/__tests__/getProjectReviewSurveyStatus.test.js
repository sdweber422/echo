/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup, runGraphQLQuery, useFixture} from 'src/test/helpers'

// FIXME: this is horrible -- result of the Slack migration
import {_saveReview} from 'src/server/cliCommand/commands/review'

import fields from '../index'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()
  useFixture.createProjectReviewSurvey()

  beforeEach('Setup Project Review Survey Data', async function () {
    await this.createProjectReviewSurvey()
    const player = await factory.create('player')
    this.currentUser = await factory.build('user', {id: player.id})

    this.invokeAPI = () => runGraphQLQuery(
      `query($projectName: String!) {
        getProjectReviewSurveyStatus(projectName: $projectName) {
          project { artifactURL }
          completed
          responses {
            questionName
            values { subjectId value }
          }
        }
      }`,
      fields,
      {projectName: this.project.name},
      {currentUser: this.currentUser}
    )
  })

  describe('when player has not started the review', function () {
    it('returns the status showing no progress', function () {
      return this.invokeAPI().then(result => {
        const status = result.data.getProjectReviewSurveyStatus
        expect(status).to.deep.eq({
          completed: false,
          project: {
            artifactURL: this.project.artifactURL
          },
          responses: [],
        })
      })
    })
  })

  describe('when player has completed the review', function () {
    beforeEach(function () {
      const responses = [
        {questionName: 'completeness', responseParams: ['8']},
      ]
      const projectName = this.project.name
      return _saveReview(this.currentUser, projectName, responses)
    })

    it('returns the status showing the completed review', function () {
      return this.invokeAPI().then(result => {
        const status = result.data.getProjectReviewSurveyStatus
        expect(status).to.deep.eq({
          completed: true,
          project: {
            artifactURL: this.project.artifactURL
          },
          responses: [
            {questionName: 'completeness', values: [{subjectId: this.project.id, value: '8'}]},
          ],
        })
      })
    })
  })
})
