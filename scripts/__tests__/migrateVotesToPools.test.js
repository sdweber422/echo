/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import Promise from 'bluebird'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'
import {votesTable} from 'src/server/db/vote'
import {cyclesTable} from 'src/server/db/cycle'
import {
  poolsTable,
  getPoolById,
  getPoolByCycleIdAndPlayerId,
  playersPoolsTable,
} from 'src/server/db/pool'

import {migrateVotesToPools} from '../migrateVotesToPools'

describe(testContext(__filename), function () {
  withDBCleanup()

  beforeEach(_setupChaptersWithCyclesAndVotes)

  it('creates pools for votes that have none', async function () {
    const voteCount = await votesTable.count()
    const cycleCount = await cyclesTable.count()
    expect(await _votesWithCycleId()).to.have.length(voteCount)
    expect(await _votesWithPoolId()).to.have.length(0)

    await migrateVotesToPools()

    expect(await _pools(), 'pool created for each cycle').to.have.length(cycleCount)
    expect(await _votesWithPoolId(), 'poolId added to votes').to.have.length(voteCount)
    await _playersVotesHaveCorrectPool()
    expect(await _votesWithCycleId(), 'cycleId removed from votes').to.have.length(0)
  })

  it('can be run multiple times without breaking things', async function () {
    await migrateVotesToPools()
    const votes = await votesTable.orderBy('id')
    const cycles = await cyclesTable.orderBy('id')
    const pools = await poolsTable.orderBy('id')
    const playersPools = await playersPoolsTable.orderBy('id')

    await migrateVotesToPools()
    expect(await votesTable.orderBy('id'), 'votes unchanged').to.deep.eq(votes)
    expect(await cyclesTable.orderBy('id'), 'cycles unchanged').to.deep.eq(cycles)
    expect(await poolsTable.orderBy('id'), 'pools unchanged').to.deep.eq(pools)
    expect(await playersPoolsTable.orderBy('id'), 'playersPools unchanged').to.deep.eq(playersPools)
  })
})

async function _playersVotesHaveCorrectPool() {
  const votes = await _votesWithPoolId()
  await Promise.map(votes, async vote => {
    const {playerId, poolId} = vote
    const pool = await getPoolById(poolId)
    const playersPool = await getPoolByCycleIdAndPlayerId(pool.cycleId, playerId)
    expect(playersPool.id).to.eq(poolId)
  })
}

async function _setupChaptersWithCyclesAndVotes() {
  const chapters = await factory.createMany('chapter', 2)
  const cycleLists = await Promise.map(chapters, _createCycles)
  const playerLists = await Promise.map(chapters, _createPlayers)
  await _createVotes({chapters, cycleLists, playerLists})
}

function _createCycles(chapter) {
  return factory.createMany('cycle', {chapterId: chapter.id}, 2)
}

function _createPlayers(chapter) {
  return factory.createMany('player', {chapterId: chapter.id}, 4)
}

function _createVotes({chapters, cycleLists, playerLists}) {
  return Promise.map(chapters, (chapter, i) => {
    const cycles = cycleLists[i]
    const players = playerLists[i]
    return Promise.map(cycles, cycle => _createVotesForCycle(cycle, players))
  })
}

function _createVotesForCycle(cycle, players) {
  const votes = players.map(player => ({
    cycleId: cycle.id,
    playerId: player.id
  }))
  return factory.createMany('vote', votes)
}

function _votesWithCycleId() {
  return votesTable.hasFields('cycleId')
}

function _votesWithPoolId() {
  return votesTable.hasFields('poolId')
}

function _pools() {
  return poolsTable
}
