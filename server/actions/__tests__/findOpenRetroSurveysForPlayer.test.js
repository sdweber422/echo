/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import nock from 'nock'

import factory from 'src/test/factories'
import {resetDB, mockIdmUsersById} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {REFLECTION} from 'src/common/models/cycle'
import {IN_PROGRESS, REVIEW} from 'src/common/models/project'

import findOpenRetroSurveysForPlayer from '../findOpenRetroSurveysForPlayer'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

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

  it('returns open, unlocked surveys for projects (player ID as identifier)', async function () {
    const chapterId = this.chapter.id
    const playerIds = this.players.map(p => p.id)
    const respondent = this.players[0]

    const cycle = await factory.create('cycle', {chapterId, state: REFLECTION})
    const surveyQuestion = await factory.create('question', {subjectType: 'player', responseType: 'text'})
    const questionRefs = playerIds.map(playerId => ({subjectIds: [playerId], questionId: surveyQuestion.id}))

    const incompleteSurvey = await factory.create('survey', {questionRefs})
    const lockedSurvey = await factory.create('survey', {questionRefs, completedBy: [respondent.id]})
    const unlockedSurvey = await factory.create('survey', {questionRefs, completedBy: [respondent.id], unlockedFor: [respondent.id]})

    const incompleteSurveyProject = await factory.create('project', {
      playerIds,
      chapterId,
      state: IN_PROGRESS,
      cycleId: cycle.id,
      retrospectiveSurveyId: incompleteSurvey.id,
    })
    const unlockedSurveyProject = await factory.create('project', {
      playerIds,
      chapterId,
      state: REVIEW,
      cycleId: cycle.id,
      retrospectiveSurveyId: unlockedSurvey.id,
    })
    await factory.create('project', {
      playerIds,
      chapterId,
      state: REVIEW,
      cycleId: cycle.id,
      retrospectiveSurveyId: lockedSurvey.id,
    }) // locked survey project

    await factory.createMany('player', 5) // extra players
    await factory.createMany('project', 5) // extra projects

    const retroSurveys = await findOpenRetroSurveysForPlayer(respondent)
    const openProjects = [incompleteSurveyProject, unlockedSurveyProject]

    expectArraysToContainTheSameElements(
      retroSurveys.map(s => s.projectId),
      openProjects.map(p => p.id)
    )
  })
})
