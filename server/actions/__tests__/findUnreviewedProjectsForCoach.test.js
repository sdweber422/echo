/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB} from 'src/test/helpers'
import factory from 'src/test/factories'
import {IN_PROGRESS, REVIEW, CLOSED} from 'src/common/models/project'

import findUnreviewedProjectsForCoach from '../findUnreviewedProjectsForCoach'

describe(testContext(__filename), function () {
  before(resetDB)

  describe('user is not a coach on any project', function () {
    it('return an empty list', async function () {
      const player = await factory.create('player')
      const projects = await findUnreviewedProjectsForCoach(player.id)
      expect(projects).to.deep.eq([])
    })
  })

  describe('coach has already reviewed all their projects', function () {
    it('return an empty list', async function () {
      const coach = await factory.create('player')
      await _createReviewedProject(coach)

      const projects = await findUnreviewedProjectsForCoach(coach.id)
      expect(projects).to.deep.eq([])
    })
  })

  describe('coach has projects needing review', function () {
    it('returns projects needing review', async function () {
      const coach = await factory.create('player')
      await _createReviewedProject(coach)

      const uncompletedSurvey = await factory.create('survey')
      const unreviewedProject = await factory.create('project', {
        coachId: coach.id,
        state: REVIEW,
        projectReviewSurveyId: uncompletedSurvey.id
      })

      const closedSurvey = await factory.create('survey')
      await factory.create('project', {
        coachId: coach.id,
        state: CLOSED,
        projectReviewSurveyId: closedSurvey.id
      })

      await factory.create('project', {
        coachId: coach.id,
        state: IN_PROGRESS,
      })

      const projects = await findUnreviewedProjectsForCoach(coach.id)
      expect(projects.map(_ => _.name)).to.deep.eq([unreviewedProject.name])
    })
  })
})

async function _createReviewedProject(coach) {
  const completedSurvey = await factory.create('survey', {completedBy: [coach.id]})
  const reviewedProject = await factory.create('project', {
    coachId: coach.id,
    state: REVIEW,
    projectReviewSurveyId: completedSurvey.id
  })
  return reviewedProject
}
