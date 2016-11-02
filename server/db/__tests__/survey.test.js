/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture} from 'src/test/helpers'
import {PRACTICE} from 'src/common/models/cycle'
import {parseQueryError} from 'src/server/db/errors'
import {updateProject} from 'src/server/db/project'
import {
  getFullRetrospectiveSurveyForPlayer,
  getRetrospectiveSurveyForPlayer,
} from 'src/server/db/survey'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()
  useFixture.buildOneQuestionSurvey()

  describe('getRetrospectiveSurveyForPlayer()', function () {
    describe('when the player is only on one project', function () {
      beforeEach(function () {
        return this.buildSurvey()
      })

      it('returns the correct survey with projectId added when no projectId specified', async function () {
        const survey = await getRetrospectiveSurveyForPlayer(this.project.playerIds[0])
        expect(survey).to.have.property('id', this.survey.id)
        expect(survey).to.have.property('projectId')
      })

      it('returns the correct survey with projectId added when projectId given explicitly', async function () {
        const survey = await getRetrospectiveSurveyForPlayer(this.project.playerIds[0], this.project.id)
        expect(survey).to.have.property('id', this.survey.id)
        expect(survey).to.have.property('projectId')
      })

      it('excludes questions about the respondent', function () {
        return getRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .then(result => {
            expect(result.questionRefs).to.have.length(this.project.playerIds.length - 1)
            expect(result.questionRefs.map(ref => ref.subjectIds)).not.to.include(this.project.playerIds[0])
          })
      })
    })

    describe('when the player is on multiple projects', function () {
      beforeEach(async function () {
        const project1 = await factory.create('project')
        const project2 = await factory.create('project', {cycleId: project1.cycleId, playerIds: project1.playerIds})
        const project3 = await factory.create('project')
        this.projects = [project1, project2, project3]

        const question = await factory.create('question')
        this.surveys = await factory.createMany('survey', 2, {
          questionRefs: [{subjectIds: [project1.playerIds], questionId: question.id}]
        })

        await updateProject({id: project1.id, retrospectiveSurveyId: this.surveys[0].id})
        await updateProject({id: project2.id, retrospectiveSurveyId: this.surveys[1].id})
      })

      it('returns the correct survey', async function () {
        const playerId = this.projects[0].playerIds[0]
        const survey0 = await getRetrospectiveSurveyForPlayer(playerId, this.projects[0].id)
        const survey1 = await getRetrospectiveSurveyForPlayer(playerId, this.projects[1].id)
        expect(survey0).to.have.property('id', this.surveys[0].id)
        expect(survey1).to.have.property('id', this.surveys[1].id)
      })

      it('raises an error if player not working on the specified project', function () {
        return expect(
          getRetrospectiveSurveyForPlayer(this.projects[0].playerIds[0], this.projects[2].id)
        ).to.be.rejectedWith('Player not on the team')
      })

      it('raises an error if no projectId provided', function () {
        return expect(
          getRetrospectiveSurveyForPlayer(this.projects[0].playerIds[0])
        ).to.be.rejectedWith('player is in multiple projects')
      })
    })
  })

  describe('getFullRetrospectiveSurveyForPlayer()', function () {
    describe('with no responses', function () {
      beforeEach(function () {
        return this.buildSurvey()
      })

      it('adds a questions array with subjectIds and responseInstructions', function () {
        return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .then(async result => {
            const {questionRefs} = await getRetrospectiveSurveyForPlayer(this.project.playerIds[0])
            expect(questionRefs).to.have.length.gt(0)
            expect(result).to.have.property('questions').with.length(questionRefs.length)
            result.questions.forEach(question => expect(question).to.have.property('subjectIds'))
            result.questions.forEach(question => expect(question).to.have.property('responseInstructions'))
          })
      })
    })

    describe('when a question has a response', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'player', responseType: 'text'},
          subjectIds: () => [this.project.playerIds[1]]
        })
        .then(() =>
          factory.create('response', {
            subjectId: this.project.playerIds[1],
            surveyId: this.survey.id,
            questionId: this.survey.questionRefs[0].questionId,
            respondentId: this.project.playerIds[0],
            value: 'some value',
          })
        ).then(response => {
          this.response = response
        })
      })

      it('includes the response', function () {
        return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .then(result => {
            expect(result.questions[0].response.values[0]).to.have.property('subjectId', this.project.playerIds[1])
            expect(result.questions[0].response.values[0]).to.have.property('value', 'some value')
          })
      })
    })

    describe('when a multipart subject question has no responses', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team'},
          subjectIds: () => this.project.playerIds
        })
      })

      it('sets response.values to an empty array', function () {
        return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .then(result => {
            expect(result.questions[0].response.values).to.deep.eq([])
          })
      })
    })

    describe('when a question has multiple responses', function () {
      beforeEach(function () {
        return this.buildOneQuestionSurvey({
          questionAttrs: {subjectType: 'team'},
          subjectIds: () => this.project.playerIds
        })
        .then(() =>
          factory.createMany('response', this.project.playerIds.map(subjectId => ({
            subjectId,
            surveyId: this.survey.id,
            questionId: this.survey.questionRefs[0].questionId,
            respondentId: this.project.playerIds[0],
            value: 'some value',
          })), 2))
        .then(responses => {
          this.responses = responses
        })
      })

      it('includes all response parts', function () {
        const sortBySubjectId = (a, b) => a.subjectId < b.subjectId ? -1 : 1
        return getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
          .then(result => {
            expect(
              result.questions[0].response.values.sort(sortBySubjectId)
            ).to.deep.eq(
              this.responses
                .sort(sortBySubjectId)
                .map(({subjectId, value}) => ({subjectId, value}))
            )
          })
      })
    })

    describe('when no reflection cycle exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('cycles').get(this.cycleId).update({state: PRACTICE})
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
            .catch(err => parseQueryError(err))
        ).to.eventually
         .have.property('message')
         .and
         .match(/no project in the reflection state/i)
      })
    })

    describe('when no project exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('projects').get(this.project.id).delete()
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
            .catch(err => parseQueryError(err))
        ).to.eventually
         .have.property('message')
         .and
         .match(/player is not in any projects/i)
      })
    })

    describe('when no survey exists', function () {
      beforeEach(function () {
        return this.buildSurvey().then(() =>
          r.table('surveys').get(this.survey.id).delete()
        )
      })

      it('rejects the promise with an appropriate error', function () {
        return expect(
          getFullRetrospectiveSurveyForPlayer(this.project.playerIds[0])
            .catch(err => parseQueryError(err))
        ).to.eventually
         .have.property('message')
         .and
         .match(/no retrospective survey/i)
      })
    })
  })
})
