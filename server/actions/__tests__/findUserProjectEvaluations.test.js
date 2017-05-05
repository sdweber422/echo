/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import Promise from 'bluebird'

import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import findUserProjectEvaluations from '../findUserProjectEvaluations'

describe(testContext(__filename), function () {
  before(resetDB)

  before(function () {
    useFixture.nockClean()
  })

  beforeEach(async function () {
    const project = await factory.create('project')
    const questions = []
    const questionRefs = []
    await Promise.each([
      STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE,
      STAT_DESCRIPTORS.TEAM_PLAY,
      STAT_DESCRIPTORS.TECHNICAL_HEALTH,
    ], async statDescriptor => {
      const stat = await factory.create('stat', {descriptor: statDescriptor})
      const question = await factory.create('question', {
        statId: stat.id,
        body: statDescriptor,
        subjectType: 'player',
        responseType: 'text',
      })
      questions.push(question)
      project.playerIds.forEach(subjectId => {
        questionRefs.push({subjectIds: [subjectId], questionId: question.id})
      })
    })
    const retrospectiveSurvey = await factory.create('survey', {questionRefs})
    await Project.get(project.id).updateWithTimestamp({retrospectiveSurveyId: retrospectiveSurvey.id})
    this.project = await Project.get(project.id)
    this.questions = questions
    this.survey = retrospectiveSurvey
  })

  it('returns correct evaluations for user on project', async function () {
    const {questions, project} = this
    const {playerIds} = project

    await Promise.map(playerIds, async subjectId => {
      await Promise.each(playerIds, async respondentId => {
        if (respondentId !== subjectId) {
          await Promise.each(questions, question => (
            factory.create('response', {
              respondentId,
              subjectId,
              surveyId: this.survey.id,
              questionId: question.id,
              value: `${question.body}_${respondentId}`,
            })
          ))
        }
      })

      const userProjectEvaluations = await findUserProjectEvaluations(subjectId, project)

      expect(userProjectEvaluations.length).to.eq(playerIds.length - 1)
      userProjectEvaluations.forEach(evaluation => {
        const respondentId = evaluation.submittedById
        expect(evaluation[STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE]).to.eq(`${STAT_DESCRIPTORS.CULTURE_CONTRIBUTION_CHALLENGE}_${respondentId}`)
        expect(evaluation[STAT_DESCRIPTORS.TEAM_PLAY]).to.eq(`${STAT_DESCRIPTORS.TEAM_PLAY}_${respondentId}`)
        expect(evaluation[STAT_DESCRIPTORS.TECHNICAL_HEALTH]).to.eq(`${STAT_DESCRIPTORS.TECHNICAL_HEALTH}_${respondentId}`)
      })
    })
  })
})
