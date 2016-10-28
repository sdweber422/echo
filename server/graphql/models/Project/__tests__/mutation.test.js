/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import {connect} from 'src/db'
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, runGraphQLMutation} from 'src/test/helpers'
import fields from 'src/server/graphql/models/Project/mutation'

const r = connect()

describe(testContext(__filename), function () {
  withDBCleanup()
  useFixture.setCurrentCycleAndUserForProject()

  describe('setProjectArtifactURL', function () {
    beforeEach(async function () {
      this.project = await factory.create('project')
      this.url = 'http://example.com/owner/repo'
    })

    it('replaces the artifactURL on the active project for a player', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const results = await runGraphQLMutation(
        `
          mutation($projectName: String!, $url: URL!) {
            setProjectArtifactURL(projectName: $projectName, url: $url) { id }
          }
        `,
        fields,
        {projectName: this.project.name, url: this.url},
        {currentUser: this.currentUser}
      )

      const project = await r.table('projects').get(results.data.setProjectArtifactURL.id)
      expect(project.artifactURL).to.equal(this.url)
    })

    it('throws an error if the player passes an invalid project name', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)

      const runMutationPromise = runGraphQLMutation(
        `
          mutation($projectName: String!, $url: URL!) {
            setProjectArtifactURL(projectName: $projectName, url: $url) { id }
          }
        `,
        fields,
        {projectName: 'non-existent-project-name', url: this.url},
        {currentUser: this.currentUser}
      )

      return expect(runMutationPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })

    it('throws an error if the player did not work on the given project', async function () {
      await this.setCurrentCycleAndUserForProject(this.project)
      const inactivePlayer = await factory.create('player', {chapterId: this.project.chapterId})
      const currentUser = await factory.build('user', {id: inactivePlayer.id, roles: ['player']})

      const runMutationPromise = runGraphQLMutation(
        `
          mutation($projectName: String!, $url: URL!) {
            setProjectArtifactURL(projectName: $projectName, url: $url) { id }
          }
        `,
        fields,
        {projectName: this.project.name, url: this.url},
        {currentUser}
      )

      return expect(runMutationPromise).to.be.rejectedWith(/No such project.*that name.*that player/)
    })
  })
})
