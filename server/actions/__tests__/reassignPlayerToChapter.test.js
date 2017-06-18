/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import Promise from 'bluebird'
import {Player} from 'src/server/services/dataService'
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

import reassignPlayersToChapter from '../reassignPlayersToChapter'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach(function () {
    return Promise.all([
      factory.createMany('player', 2).then(players => {
        this.players = players
        this.playersById = players.reduce((obj, player) => Object.assign(obj, {[player.id]: player}), {})
      }),
      factory.create('chapter').then(c => {
        this.newChapter = c
      }),
    ])
  })

  it('changes the players chapterId & chapterHistory', async function () {
    const playerIds = Object.keys(this.playersById)
    await reassignPlayersToChapter(playerIds, this.newChapter.id)
    const players = await Player.getAll(...playerIds)
    players.forEach(player => {
      const oldChapterId = this.playersById[player.id].chapterId
      expect(player.chapterId).to.equal(this.newChapter.id)
      expect(player.chapterHistory).to.have.length(1)
      expect(player.chapterHistory[0].chapterId).to.equal(oldChapterId)
    })
  })

  it('returns the new players', async function () {
    const playerIds = this.players.map(p => p.id)
    const result = await reassignPlayersToChapter(playerIds, this.newChapter.id)
    const players = await Player.getAll(...playerIds)
    expect(result.length).to.equal(players.length)
    players.forEach((player, i) => {
      expect(result[i].id).to.equal(player.id)
      expect(result[i].chapterId).to.equal(player.chapterId)
      expect(result[i].createdAt.getTime()).to.deep.equal(player.createdAt.getTime())
      expect(result[i].updatedAt.getTime()).to.equal(player.updatedAt.getTime())
      expect(result[i].chapterHistory).to.deep.equal(player.chapterHistory)
    })
  })

  it('ignores players already in the given chapter', function () {
    const playerIds = this.players.map(p => p.id)
    const result = reassignPlayersToChapter(playerIds, this.players[0].chapterId)
    return expect(result).to.eventually.have.length(1)
  })

  it('resolve promise with empty array when no matches', function () {
    const result = reassignPlayersToChapter(['not-a-player-id'], this.newChapter.id)
    return expect(result).to.eventually.deep.equal([])
  })
})
