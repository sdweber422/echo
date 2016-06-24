/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('setProjectArtifactURL', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
      this.url = 'http://example.com/owner/repo'
      // TEST HELPERS:
      //   We need a way to pull out individual cycles from the project that gets created
      //   by the factory. Depending on which case we're testing, we need either the latest cycle
      //   (happy path) or the earliest cycle (error case).
      this.latestCycleSelector = (lastCycle, currentCycle) => (
        lastCycle && (lastCycle.cycleNumber > currentCycle.cycleNumber) ? lastCycle : currentCycle
      )
      this.earliestCycleSelector = (lastCycle, currentCycle) => (
        !lastCycle || (currentCycle.cycleNumber < lastCycle.cycleNumber) ? currentCycle : lastCycle
      )
      this._getCycleFromProject = (project, selector) => {
        return Object.keys(project.cycleTeams).reduce(async (lastCyclePromise, cycleId) => {
          const currentCycle = await r.table('cycles').get(cycleId)
          const lastCycle = await lastCyclePromise  // function passed to reduce is async, so we need to resolve
          return selector(lastCycle, currentCycle)
        }, null)
      }
    })

    it('replaces the artifactURL on the active project for a player', async function() {
      const cycle = await this._getCycleFromProject(this.project, this.latestCycleSelector)
      const playerId = this.project.cycleTeams[cycle.id].playerIds[0]
      const currentUser = await factory.build('user', {id: playerId, roles: ['player']})
      const results = await runGraphQLMutation(
        `
          mutation($url: URL!) {
            setProjectArtifactURL(url: $url) { id }
          }
        `,
        fields,
        {url: this.url},
        {currentUser}
      )

      const project = await r.table('projects').get(results.data.setProjectArtifactURL.id)
      expect(project.artifactURL).to.equal(this.url)
    })

    it('throws an error if the player has no active project', async function () {
      const cycle = await this._getCycleFromProject(this.project, this.earliestCycleSelector)
      const playerId = this.project.cycleTeams[cycle.id].playerIds[0]
      const currentUser = await factory.build('user', {id: playerId, roles: ['player']})
      const runMutationPromise = runGraphQLMutation(
        `
          mutation($url: URL!) {
            setProjectArtifactURL(url: $url) { id }
          }
        `,
        fields,
        {url: this.url},
        {currentUser}
      )

      return expect(runMutationPromise).to.be.rejectedWith(/not in any projects this cycle/)
    })
  })
})
