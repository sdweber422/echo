/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import r from '../../r'
import findProjectsAndReviewResponsesForPlayer from '../findProjectsAndReviewResponsesForPlayer'

describe(testContext(__filename), function () {
  useFixture.createChapterInReflectionState()

  beforeEach(resetDB)

  describe('when there are projects to review', function () {
    beforeEach(async function () {
      await this.createChapterInReflectionState()

      // review the first project
      this.reviewedProject = this.projects[0]
      this.reviewedProjectSurvey = this.surveys[0]
      this.respondentId = this.reviewedProject.playerIds[0]
      await Promise.all(this.reviewedProjectSurvey.questionRefs.map((ref, i) => {
        return saveSurveyResponse({
          respondentId: this.respondentId,
          values: [{
            subjectId: this.reviewedProject.id,
            value: i + 10,
          }],
          surveyId: this.reviewedProjectSurvey.id,
          questionId: ref.questionId,
        })
      }))

      // record survey as complete
      await r.table('surveys')
        .get(this.reviewedProjectSurvey.id)
        .update(row => ({
          completedBy: row('completedBy').default([]).setInsert(this.respondentId),
          unlockedFor: row('unlockedFor').default([]).setDifference([this.respondentId]),
          updatedAt: new Date(),
        }))

      this.projectsForReview = await findProjectsAndReviewResponsesForPlayer(this.chapter.id, this.cycle.id, this.respondentId)
    })

    it('finds all of the projects for the given cycle', function () {
      return expect(this.projectsForReview.length).to.equal(this.projects.length)
    })

    it('returns any review responses for the player', function () {
      this.projectsForReview.forEach(project => {
        expect(project).to.have.property('projectReviewResponses')
        expect(project.projectReviewResponses.length).to.equal(this.reviewedProjectSurvey.questionRefs.length)

        if (project.id === this.reviewedProject.id) {
          project.projectReviewResponses.forEach(response => {
            expect(response.value).to.be.ok
          })
        } else {
          project.projectReviewResponses.forEach(response => {
            expect(response.value).to.not.be.ok
          })
        }
      })
    })
  })

  describe('when there are no projects to review', function () {
    it('returns an empty array', async function () {
      const chapter = await factory.create('chapter')
      const cycle = await factory.create('cycle', {chapterId: chapter.id})
      const player = await factory.create('player', {chapterId: chapter.id})
      const returnedProjects = await findProjectsAndReviewResponsesForPlayer(chapter.id, cycle.id, player.id)

      expect(returnedProjects.length).to.equal(0)
    })
  })

  describe('when there is a project without a review survey', function () {
    it('returns an empty array', async function () {
      const chapter = await factory.create('chapter')
      const cycle = await factory.create('cycle', {chapterId: chapter.id})
      const player = await factory.create('player', {chapterId: chapter.id})
      await factory.create('project', {chapterId: chapter.id, cycleId: cycle.id, playerIds: [player.id]})
      const returnedProjects = await findProjectsAndReviewResponsesForPlayer(chapter.id, cycle.id, player.id)

      expect(returnedProjects.length).to.equal(0)
    })
  })
})
