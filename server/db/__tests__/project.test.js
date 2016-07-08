/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {
  findProjectByNameForPlayer,
  findProjectBySurveyId,
  getTeamPlayerIds,
  setRetrospectiveSurveyForCycle,
  setProjectReviewSurveyForCycle,
  findActiveProjectReviewSurvey,
  getLatestCycleId,
  getProjectByName,
} from '../project'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  describe('findProjectByNameForPlayer()', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
    })

    it('finds the project with the given name where the user is or was a team member', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const project = await findProjectByNameForPlayer(this.project.name, this.currentUser.id)
      return expect(getTeamPlayerIds(project, this.currentCycle.id)).to.contain(this.currentUser.id)
    })

    it('throws an error if the player has never worked on that project', async function () {
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})

      const projectPromise = findProjectByNameForPlayer(this.project.name, inactivePlayer.id)
      return expect(projectPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })

    it('throws an error if there is no project with the given name', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const projectPromise = findProjectByNameForPlayer('non-existent-project-name', this.currentUser.id)
      return expect(projectPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })
  })

  describe('getProjectByName()', function () {
    it('finds the right project', async function () {
      const project = await factory.create('project', {name: 'projectName'})
      const result = await getProjectByName('projectName')
      expect(result.id).to.eq(project.id)
    })

    it('rejects the promise when no project found', async function () {
      await factory.create('project', {name: 'projectName'})
      const promise = getProjectByName('anotherName')
      await expect(promise).to.eventually.be.rejectedWith('No project found')
    })
  })

  describe('findActiveProjectReviewSurvey()', function () {
    it('finds the right survey', async function () {
      const projectWithoutSurvey = await factory.create('project')
      const survey = await factory.create('survey')
      const {changes: [{new_val: project}]} = await setProjectReviewSurveyForCycle(
        projectWithoutSurvey.id,
        getLatestCycleId(projectWithoutSurvey),
        survey.id,
        {returnChanges: true}
      )
      const result = await findActiveProjectReviewSurvey(project)
      expect(result.id).to.eq(survey.id)
    })

    it('resolves to undefined when no project found', async function () {
      const project = await factory.create('project')
      const result = await findActiveProjectReviewSurvey(project)
      expect(result).to.be.undefined
    })
  })

  describe('findProjectBySurveyId()', function () {
    it('finds the right project for a given retrospectiveSurveyId', async function () {
      const [otherProject, targetProject] = await factory.createMany('project', 2)
      const [otherSurvey, targetSurvey] = await factory.createMany('survey', 2)

      await setRetrospectiveSurveyForCycle(targetProject.id, getLatestCycleId(targetProject), targetSurvey.id)
      await setRetrospectiveSurveyForCycle(otherProject.id, getLatestCycleId(otherProject), otherSurvey.id)

      const returnedProject = await findProjectBySurveyId(targetSurvey.id)
      expect(returnedProject.id).to.eq(targetProject.id)
    })

    it('finds the right project for a given projectReviewSurveyId', async function () {
      const [otherProject, targetProject] = await factory.createMany('project', 2)
      const [otherSurvey, targetSurvey] = await factory.createMany('survey', 2)

      await setProjectReviewSurveyForCycle(targetProject.id, getLatestCycleId(targetProject), targetSurvey.id)
      await setProjectReviewSurveyForCycle(otherProject.id, getLatestCycleId(otherProject), otherSurvey.id)

      const returnedProject = await findProjectBySurveyId(targetSurvey.id)
      expect(returnedProject.id).to.eq(targetProject.id)
    })
  })
})
