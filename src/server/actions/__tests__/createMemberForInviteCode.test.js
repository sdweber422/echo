/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {Member} from 'src/server/services/dataService'
import {resetDB} from 'src/test/helpers'

import createMemberForInviteCode from '../createMemberForInviteCode'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('set up data', async function () {
    this.inviteCode = 'test_code'
    this.chapter = await factory.create('chapter', {inviteCodes: [this.inviteCode]})
    this.user = await factory.build('user', {inviteCode: this.inviteCode})
  })

  it('creates a member in the correct chapter for a valid user ID and invite code', async function () {
    await createMemberForInviteCode(this.user.id, this.inviteCode)
    const members = await Member.filter({id: this.user.id, chapterId: this.chapter.id})
    expect(members.length).to.eq(1)
  })

  it('throws an error if member already creates for user & chapter', async function () {
    await Member.save({id: this.user.id, chapterId: this.chapter.id})
    const result = createMemberForInviteCode(this.user.id, this.inviteCode)
    return expect(result).to.be.rejectedWith(/already has membership/)
  })
})
