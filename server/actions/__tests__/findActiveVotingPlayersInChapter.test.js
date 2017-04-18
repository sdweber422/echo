/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {truncateDBTables, useFixture} from 'src/test/helpers'
import factory from 'src/test/factories'

import findActiveVotingPlayersInChapter from '../findActiveVotingPlayersInChapter'

describe(testContext(__filename), function () {
  before(truncateDBTables)

  beforeEach(function () {
    useFixture.nockClean()
  })

  it('returns players for the given chapter who are active and can vote according to IDM', async function () {
    const chapter = await factory.create('chapter')
    const players = await factory.createMany('player', {chapterId: chapter.id}, 10)
    const users = players.map(_ => ({id: _.id, active: true}))
    users[0].active = users[1].active = false
    users[2].roles = users[3].roles = ['coach']
    useFixture.nockIDMGetUsersById(users)

    const activePlayers = await findActiveVotingPlayersInChapter(chapter.id)

    expect(activePlayers.length).to.equal(6)
  })
})
