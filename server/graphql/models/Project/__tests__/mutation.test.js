/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup, useFixture, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  describe('setProjectArtifactURL', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
      this.url = 'http://example.com/owner/repo'
    })

    it('replaces the artifactURL on the active project for a player', async function() {
      await this.setCurrentCycleAndUserForProject(this.project)

      const results = await runGraphQLMutation(
        `
          mutation($url: URL!) {
            setProjectArtifactURL(url: $url) { id }
          }
        `,
        fields,
        {url: this.url},
        {currentUser: this.currentUser}
      )

      const project = await r.table('projects').get(results.data.setProjectArtifactURL.id)
      expect(project.artifactURL).to.equal(this.url)
    })

    it('throws an error if the player has no active project', async function () {
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})
      const currentUser = await factory.build('user', {id: inactivePlayer.id, roles: ['player']})
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
