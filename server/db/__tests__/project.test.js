/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {
  findProjectByNameForPlayer,
  findProjectByRetrospectiveSurveyId,
  getTeamPlayerIds,
  setRetrospectiveSurveyForCycle,
  getCycleIds,
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

  describe('findProjectByRetrospectiveSurveyId()', function () {
    it('finds the right project', async function () {
      const [otherProject, targetProject] = await factory.createMany('project', 2)
      const [otherSurvey, targetSurvey] = await factory.createMany('survey', 2)

      await setRetrospectiveSurveyForCycle(targetProject.id, getCycleIds(targetProject)[0], targetSurvey.id)
      await setRetrospectiveSurveyForCycle(otherProject.id, getCycleIds(otherProject)[0], otherSurvey.id)

      const returnedProject = await findProjectByRetrospectiveSurveyId(targetSurvey.id)
      expect(returnedProject.id).to.eq(targetProject.id)
    })
  })
})
