/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import factory from '../../../test/factories'
import {withDBCleanup, useFixture} from '../../../test/helpers'
import {findCurrentProjectForPlayerId, getTeamPlayerIds} from '../project'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  describe('findCurrentProjectForPlayerId', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
    })

    it('finds the project where the given player is on the team for the latest cycle', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const project = await findCurrentProjectForPlayerId(this.currentUser.id)
      return expect(getTeamPlayerIds(project, this.currentCycle.id)).to.contain(this.currentUser.id)
    })

    it('throws an error if the player is not on any current project', async function () {
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})

      const projectPromise = findCurrentProjectForPlayerId(inactivePlayer.id)
      return expect(projectPromise).to.be.rejectedWith(/player is not in any projects this cycle/)
    })
  })
})
