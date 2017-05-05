/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {COMPLETE, PRACTICE} from 'src/common/models/cycle'
import {resetDB, useFixture, mockIdmUsersById, expectArraysToContainTheSameElements} from 'src/test/helpers'
import {Cycle, Project, Response} from 'src/server/services/dataService'
import stubs from 'src/test/stubs'
import factory from 'src/test/factories'

import {getCommand} from 'src/server/cliCommand/util'

import {concatResults} from './helpers'

describe(testContext(__filename), function () {
  useFixture.createProjectReviewSurvey()
  useFixture.ensureNoGlobalWindow()
  beforeEach(resetDB)
  beforeEach(function () {
    stubs.chatService.enable()
  })
  afterEach(function () {
    stubs.chatService.disable()
  })

  describe('review', function () {
    beforeEach(async function () {
      const {commandSpec, commandImpl} = getCommand('review')
      this.commandSpec = commandSpec
      this.commandImpl = commandImpl
      await this.createProjectReviewSurvey()
      const player = await factory.create('player', {chapterId: this.cycle.chapterId})
      this.user = await factory.build('user', {id: player.id})
      this.invokeCommand = async function (argv = [this.project.name, '80']) {
        const args = this.commandSpec.parse(argv)
        const result = await this.commandImpl.invoke(args, {user: this.user})
        return concatResults(result)
      }
      mockIdmUsersById(this.project.playerIds)
    })
    afterEach(function () {
      useFixture.nockClean()
    })

    it('returns new response ids for all responses created in REFLECTION state', async function () {
      const fullResult = await this.invokeCommand()
      expect(fullResult).to.match(/review is complete/i)
    })

    it('returns new response ids for all responses created in COMPLETE', async function () {
      await Cycle.get(this.cycle.id).update({state: COMPLETE})
      const fullResult = await this.invokeCommand()
      expect(fullResult).to.match(/review is complete/i)
    })

    it('returns helpful error messages for invalid values', async function () {
      expect(this.invokeCommand([this.project.name, '101'])).to.eventually.be.rejectedWith(/less than.*100/i)
    })

    describe('when the cycle is not in reflection', async function () {
      it('returns an error', async function () {
        await Cycle.get(this.cycle.id).update({state: PRACTICE})
        expect(this.invokeCommand()).to.eventually.be.rejectedWith(/PRACTICE state/i)
      })
    })
    describe('when the project artifact is not set', async function () {
      it('returns an error', async function () {
        await Project.get(this.project.id).update({artifactURL: null})
        expect(this.invokeCommand()).to.eventually.be.rejectedWith(/until the project artifact is set./)
      })
    })
  })

  describe('_saveReview()', function () {
    const {_saveReview} = require('../review')

    beforeEach(async function () {
      await this.createProjectReviewSurvey()
      const player = await factory.create('player', {chapterId: this.cycle.chapterId})
      this.currentUser = await factory.build('user', {id: player.id})
      this.ast = {rootValue: {currentUser: this.currentUser}}
      this.players = await mockIdmUsersById(this.project.playerIds)
    })
    afterEach(function () {
      useFixture.nockClean()
    })

    describe('submitting a review for another team', function () {
      it('saves the responses with the right attributes', async function () {
        const unsavedResponses = [{questionName: 'completeness', responseParams: ['80']}]
        const {createdIds} = await _saveReview(this.currentUser, this.project.name, unsavedResponses)

        const responses = await Response.run()
        expect(responses.length).to.eq(1)
        expectArraysToContainTheSameElements(createdIds, responses.map(({id}) => id))
        expect(responses.find(response => response.questionId === this.questionCompleteness.id))
          .to.have.property('value', 80)
        responses.forEach(response => _checkResponse(response, this.survey, this.currentUser, this.project))
      })
    })

    describe('attempting to submit an internal review', function () {
      it('throws a helpful error', async function () {
        const playerId = this.project.playerIds[0]
        const currentUser = await factory.build('user', {id: playerId})
        const responses = [{questionName: 'completeness', responseParams: ['80']}]

        const result = _saveReview(currentUser, this.project.name, responses)
        return expect(result).to.be.rejectedWith(new RegExp(`You are on team #${this.project.name}`, 'i'))
      })
    })

    describe('attempting to submit a review for a project without an artifact set', function () {
      const chatService = require('src/server/services/chatService')
      it('throws an error and direct messages the project members', async function () {
        await Project.get(this.project.id).update({artifactURL: null})
        const responses = [{questionName: 'completeness', responseParams: ['80']}]
        const playerHandles = this.players.map(p => p.handle)

        const result = _saveReview(this.currentUser, this.project.name, responses)
        await expect(result).to.be.rejectedWith(`Reviews cannot be processed for project ${this.project.name} because an artifact has not been set. The project members have been notified.`)
        expect(chatService.sendDirectMessage.callCount).to.eql(1)
        expect(chatService.sendDirectMessage).to.have.been.calledWith(playerHandles, `A review has been blocked for project ${this.project.name}. Please set your artifact.`)
      })
    })
  })
})

function _checkResponse(response, survey, respondent, subject) {
  expect(response).to.have.property('surveyId', survey.id)
  expect(response).to.have.property('respondentId', respondent.id)
  expect(response.subjectId).to.eq(subject.id)
}
