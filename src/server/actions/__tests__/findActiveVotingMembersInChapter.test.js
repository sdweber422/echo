/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {resetDB, useFixture, expectArraysToContainTheSameElements} from 'src/test/helpers'
import factory from 'src/test/factories'

import findActiveVotingMembersInChapter from '../findActiveVotingMembersInChapter'

describe(testContext(__filename), function () {
  before(resetDB)

  beforeEach(function () {
    useFixture.nockClean()
  })

  it('returns members for the given chapter who are active and can vote according to IDM', async function () {
    const chapter = await factory.create('chapter')
    const votingPhase = await factory.create('phase', {hasVoting: true})
    const nonVotingPhase = await factory.create('phase', {hasVoting: false})
    const votingMembers = await factory.createMany('member', {chapterId: chapter.id, phaseId: votingPhase.id}, 5)
    const nonVotingMembers = await factory.createMany('member', {chapterId: chapter.id, phaseId: nonVotingPhase.id}, 5)
    const inactiveVotingMembers = await factory.createMany('member', {chapterId: chapter.id, phaseId: votingPhase.id}, 5)
    const votingUsers = votingMembers.map(m => ({id: m.id, active: true}))
    const nonVotingUsers = nonVotingMembers.map(m => ({id: m.id, active: true}))
    const inactiveVotingUsers = inactiveVotingMembers.map(m => ({id: m.id, active: false}))
    const allUsers = votingUsers.concat(nonVotingUsers).concat(inactiveVotingUsers)
    useFixture.nockIDMGetUsersById(allUsers)

    const activeVotingMembers = await findActiveVotingMembersInChapter(chapter.id)

    expect(activeVotingMembers.length).to.equal(votingMembers.length)
    expectArraysToContainTheSameElements(
      activeVotingMembers.map(m => m.id),
      votingMembers.map(m => m.id)
    )
  })
})
