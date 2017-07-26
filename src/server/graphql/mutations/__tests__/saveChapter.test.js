/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLMutation} from 'src/test/helpers'

import fields from '../index'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('saveChapter', function () {
    beforeEach('create member with admin role', async function () {
      this.user = await factory.build('user', {roles: ['admin']})
      this.member = await factory.create('member', {id: this.user.id})
    })

    before(function () {
      this.saveChapter = function (inputChapter) {
        return runGraphQLMutation(
          `mutation($chapter: InputChapter!) { saveChapter(chapter: $chapter) {
            id
            name
            channelName
            timezone
            githubTeamId
            inviteCodes
            createdAt
            updatedAt
          }}`,
          fields,
          {chapter: inputChapter},
          {currentUser: this.user},
        )
      }
    })

    it('creates a new chapter', async function () {
      const {
        name,
        channelName,
        timezone,
        inviteCodes,
      } = await factory.build('chapter', {name: 'justachaptername'})

      const result = await this.saveChapter({
        name,
        channelName,
        timezone,
        inviteCodes,
      })

      const newChapter = result.data.saveChapter
      expect(newChapter).to.have.property('name').eq(name)
      expect(newChapter).to.have.property('channelName').eq(channelName)
      expect(newChapter).to.have.property('timezone').eq(timezone)
    })
  })
})
