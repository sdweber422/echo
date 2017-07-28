/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import findActiveMembersForPhase from '../findActiveMembersForPhase'

describe(testContext(__filename), function () {
  before(resetDB)

  beforeEach(function () {
    useFixture.nockClean()
  })

  it('returns members for the given phase who are active according to IDM', async function () {
    const phase = await factory.create('phase')
    const members = await factory.createMany('member', {phaseId: phase.id}, 5)
    const users = members.map(u => ({id: u.id, active: true}))
    users[0].active = users[1].active = false
    useFixture.nockIDMFindUsers(users)

    const activePhaseMembers = await findActiveMembersForPhase(phase.id)

    expect(activePhaseMembers.length).to.equal(3)
  })
})
