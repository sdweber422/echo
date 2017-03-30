/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'
import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'

import {
  compileSurveyQuestionDataForPlayer,
  compileSurveyDataForPlayer
} from '../compileSurveyData'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.buildSurvey()

  beforeEach('Setup Survey Data', async function () {
    nock.cleanAll()

    const teamQuestion = await factory.create('question', {
      responseType: 'relativeContribution',
      subjectType: 'team',
    })
    const playerQuestion = await factory.create('question', {
      body: 'What is one thing {{subject}} did well?',
      responseType: 'text',
      subjectType: 'player',
    })
    const coachQuestion = await factory.create('question', {
      body: '{{subject}} was an awesome coach.',
      responseType: 'likert7Agreement',
      subjectType: 'coach',
    })
    await this.buildSurvey([
      {questionId: teamQuestion.id, subjectIds: () => this.project.playerIds},
      {questionId: playerQuestion.id, subjectIds: () => [this.project.playerIds[1]]},
      {questionId: coachQuestion.id, subjectIds: () => [this.project.coachId]},
    ])

    const projectMemberIds = [...this.project.playerIds, this.project.coachId]
    const users = await mockIdmUsersById(projectMemberIds)
    this.currentUser = users[0]
    this.coach = null
    this.players = []
    users.forEach(user => {
      if (user.id === this.project.coachId) {
        this.coach = user
      }
      if (this.project.playerIds.find(playerId => playerId === user.id)) {
        this.players.push(user)
      }
    })
  })

  afterEach(function () {
    nock.cleanAll()
  })

  describe('compileSurveyQuestionDataForPlayer()', function () {
    it('gets a single question from the survey by index', function () {
      const questionNumber = 2 // <-- 1-based
      const questionIndex = 1 // <-- 0-based

      return compileSurveyQuestionDataForPlayer(this.currentUser.id, questionNumber).then(result =>
        expect(result).to.have.property('id', this.survey.questionRefs[questionIndex].questionId)
      )
    })

    it('renders the question body template', function () {
      return compileSurveyQuestionDataForPlayer(this.currentUser.id, 2).then(question => {
        expect(question.body)
          .to.contain(`@${question.subjects[0].handle}`)
      })
    })
  })

  describe('compileSurveyDataForPlayer()', function () {
    it('returns the survey for the correct cycle and project for the current user', function () {
      return compileSurveyDataForPlayer(this.currentUser.id).then(result =>
        expect(result.id).to.eq(this.survey.id)
      )
    })

    it('renders the question body templates', async function () {
      const result = await compileSurveyDataForPlayer(this.currentUser.id)
      expect(result.questions[1].body).to.contain(`@${this.players[1].handle}`)
      expect(result.questions[2].body).to.contain(`@${this.coach.handle}`)
    })

    it('returns a meaningful error when lookup fails', function () {
      return r.table('surveys').get(this.survey.id).delete()
        .then(() => expect(
          compileSurveyDataForPlayer(this.currentUser.id)
        ).to.be.rejectedWith(/no retrospective survey/))
    })

    it('returns a rejected promise if the survey is locked', async function () {
      await r.table('surveys').get(this.survey.id).update({completedBy: [this.currentUser.id]})
      expect(
        compileSurveyDataForPlayer(this.currentUser.id)
      ).to.be.rejectedWith(/is locked/)
    })
  })
})
