/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {withDBCleanup, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import findProjectByNameForPlayer from '../findProjectByNameForPlayer'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  beforeEach(async function () {
    this.project = await factory.create('project')
  })

  it('finds the project with the given name where the user is or was a team member', async function () {
    await this.setCurrentCycleAndUserForProject(this.project)
    const project = await findProjectByNameForPlayer(this.project.name, this.currentUser.id)
    return expect(project.playerIds).to.contain(this.currentUser.id)
  })

  it('throws an error if the player has never worked on that project', async function () {
    const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})
    const projectPromise = findProjectByNameForPlayer(this.project.name, inactivePlayer.id)
    return expect(projectPromise).to.be.rejectedWith(/Project.*.not found/)
  })

  it('throws an error if there is no project with the given name', async function () {
    await this.setCurrentCycleAndUserForProject(this.project)
    const projectPromise = findProjectByNameForPlayer('non-existent-project-name', this.currentUser.id)
    return expect(projectPromise).to.be.rejectedWith(/Project.*.not found/)
  })
})
