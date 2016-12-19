/* eslint-env mocha */
/* global expect testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {truncateDBTables} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {GOAL_SELECTION, PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'

import findActiveProjectsForPlayer from '../findActiveProjectsForPlayer'

describe(testContext(__filename), function () {
  beforeEach(truncateDBTables)

  it('throws an error if playerIdentifier is invalid', function () {
    const result = findActiveProjectsForPlayer('fake.id')
    expect(result).to.be.rejectedWith(/Player not found/)
  })

  it('returns empty array if player has no active projects (player obj as identifier)', async function () {
    const player = await factory.create('player')
    const activeProjects = await findActiveProjectsForPlayer(player.id)
    expect(activeProjects.length).to.eq(0)
  })

  it('returns only projects in active cycles (player ID as identifier)', async function () {
    const chapter = await factory.create('chapter')
    const chapterId = chapter.id

    const players = await factory.createMany('player', {chapterId: chapter.id}, 3)
    const playerIds = players.map(p => p.id)

    const inactiveCycle1 = await factory.create('cycle', {chapterId, state: GOAL_SELECTION})
    const inactiveCycle2 = await factory.create('cycle', {chapterId, state: PRACTICE})
    const activeCycle1 = await factory.create('cycle', {chapterId, state: REFLECTION})
    const activeCycle2 = await factory.create('cycle', {chapterId, state: COMPLETE})

    await factory.createMany('project', {playerIds, chapterId, cycleId: inactiveCycle1.id}, 1)
    await factory.createMany('project', {playerIds, chapterId, cycleId: inactiveCycle2.id}, 2)
    const activeCycle1Projects = await factory.createMany('project', {playerIds, chapterId, cycleId: activeCycle1.id}, 3)
    const activeCycle2Projects = await factory.createMany('project', {playerIds, chapterId, cycleId: activeCycle2.id}, 4)

    await factory.createMany('player', 5) // extra players
    await factory.createMany('project', 5) // extra projects

    const activeProjects = await findActiveProjectsForPlayer(players[0].id)

    expect(activeProjects.length).to.eq(activeCycle1Projects.length + activeCycle2Projects.length)
    expectArraysToContainTheSameElements(
      activeProjects.map(p => p.id),
      activeCycle1Projects.concat(activeCycle2Projects).map(p => p.id)
    )
  })
})
