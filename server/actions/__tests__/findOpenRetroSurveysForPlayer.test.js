/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'

import factory from 'src/test/factories'
import {truncateDBTables, mockIdmUsersById} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'
import {PROJECT_STATES} from 'src/common/models/project'

import findOpenRetroSurveysForPlayer from '../findOpenRetroSurveysForPlayer'

describe(testContext(__filename), function () {
  beforeEach(truncateDBTables)

  beforeEach(async function () {
    nock.cleanAll()
    this.chapter = await factory.create('chapter')
    this.players = await factory.createMany('player', {chapterId: this.chapter.id}, 3)
    await mockIdmUsersById(this.players.map(p => p.id), null, {times: 100})
  })

  it('throws an error if player identifier is invalid', function () {
    const result = findOpenRetroSurveysForPlayer('fake.id')
    return expect(result).to.be.rejectedWith(/Player not found/)
  })

  it('returns empty array if player has no active projects (player obj as identifier)', async function () {
    const retroSurveys = await findOpenRetroSurveysForPlayer(this.players[0])
    expect(retroSurveys.length).to.eq(0)
  })

  it('returns only surveys for projects in active cycles (player ID as identifier)', async function () {
    const chapterId = this.chapter.id
    const playerIds = this.players.map(p => p.id)

    const completeCycle = await factory.create('cycle', {chapterId, state: COMPLETE})
    const reflectionCycle = await factory.create('cycle', {chapterId, state: REFLECTION})
    const practiceCycle = await factory.create('cycle', {chapterId, state: PRACTICE})

    await factory.create('project', {playerIds, chapterId, cycleId: practiceCycle.id})

    const surveyQuestion = await factory.create('question', {subjectType: 'player', responseType: 'text'})
    const questionRefs = playerIds.map(playerId => ({subjectIds: [playerId], questionId: surveyQuestion.id}))

    const completeCycleSurvey = await factory.create('survey', {questionRefs})
    const completeCycleProjects = await factory.createMany('project', {
      playerIds,
      chapterId,
      state: PROJECT_STATES.REVIEW,
      cycleId: completeCycle.id,
      retrospectiveSurveyId: completeCycleSurvey.id,
    }, 5)

    const reflectionCycleSurvey = await factory.create('survey', {questionRefs})
    const reflectionCycleProjects = await factory.create('project', {
      playerIds,
      chapterId,
      state: PROJECT_STATES.REVIEW,
      cycleId: reflectionCycle.id,
      retrospectiveSurveyId: reflectionCycleSurvey.id,
    })

    await factory.createMany('player', 5) // extra players
    await factory.createMany('project', 5) // extra projects
    await factory.createMany('project', {
      playerIds,
      chapterId,
      state: PROJECT_STATES.CLOSED,
      cycleId: completeCycle.id,
      retrospectiveSurveyId: completeCycleSurvey.id,
    }, 5) // closed projects in a completed cycle

    const retroSurveys = await findOpenRetroSurveysForPlayer(this.players[0])

    const pendingProjects = completeCycleProjects.concat(reflectionCycleProjects)

    expectArraysToContainTheSameElements(
      retroSurveys.map(s => s.projectId),
      pendingProjects.map(p => p.id)
    )
  })
})
