/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from 'src/db/connect'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  getPlayerById,
  reassignPlayersToChapter,
  savePlayerProjectStats,
} from 'src/server/db/player'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getPlayerById', function () {
    beforeEach(function () {
      return factory.create('player').then(player => {
        this.player = player
      })
    })

    it('returns a shallow player by default', function () {
      return getPlayerById(this.player.id)
        .then(player => {
          expect(player).to.have.property('chapterId')
          expect(player).to.not.have.property('chapter')
        })
    })

    it('merges in the chapter info when requested', function () {
      return getPlayerById(this.player.id, {mergeChapter: true})
        .then(player => {
          expect(player).to.not.have.property('chapterId')
          expect(player).to.have.property('chapter')
          expect(player.chapter).to.have.property('id')
          expect(player.chapter).to.have.property('name')
        })
    })
  })

  describe('reassignPlayersToChapter()', function () {
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

    it('changes the players chapterId & chapterHistory', function () {
      const playerIds = Object.keys(this.playersById)
      return reassignPlayersToChapter(playerIds, this.newChapter.id)
        .then(() => r.table('players').getAll(...playerIds).run())
        .then(players => {
          players.forEach(player => {
            const oldChapterId = this.playersById[player.id].chapterId
            expect(player.chapterId).to.equal(this.newChapter.id)
            expect(player.chapterHistory).to.have.length(1)
            expect(player.chapterHistory[0].chapterId).to.equal(oldChapterId)
          })
        })
    })

    it('returns the new players', function () {
      const playerIds = this.players.map(p => p.id)
      return reassignPlayersToChapter(playerIds, this.newChapter.id).then(result =>
        r.table('players').getAll(...playerIds).run().then(playersFromDB =>
          expect(result).to.deep.equal(playersFromDB)
        )
      )
    })

    it('ignores players already in the given chapter', function () {
      const playerIds = this.players.map(p => p.id)
      expect(
        reassignPlayersToChapter(playerIds, this.players[0].chapterId)
      ).to.eventually.have.length(1)
    })

    it('resolve promise with empty array when no matches', function () {
      expect(
        reassignPlayersToChapter(['not-a-player-id'], this.newChapter.id)
      ).to.eventually.deep.equal([])
    })
  })

  describe('savePlayerProjectStats', function () {
    beforeEach(async function () {
      this.projectIds = [await r.uuid(), await r.uuid()]
      this.player = await factory.create('player', {stats: {ecc: 0}})
      this.fetchPlayer = () => getPlayerById(this.player.id)
    })

    it('creates the stats.ecc attribute if missing', async function() {
      const projectStats = {ecc: 40, abc: 4, rc: 10, ls: 80, tp: 83, cc: 90, hours: 35, ec: 15, ecd: -5}
      await getPlayerById(this.player.id).replace(p => p.without('stats'))
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.ecc).to.eq(40)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats,
      })
    })

    it('adds to the existing cumulative stats.ecc', async function() {
      expect(this.player).to.have.deep.property('stats.ecc')

      const projectStats = {ecc: 20, abc: 4, rc: 5, ec: 10, ecd: -5, ls: 80, tp: 83, cc: 85, hours: 30}
      await getPlayerById(this.player.id).update({stats: {ecc: 10}})
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.ecc).to.eq(30)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[1]]: projectStats,
      })
    })

    it('creates the stats.projects attribute if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectStats = {ecc: 20, abc: 4, rc: 5, ec: 10, ecd: -5, ls: 80, tp: 83, cc: 85, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.ecc).to.eq(20)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats,
      })
    })

    it('adds a project entry to the stats if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectStats = [
        {ecc: 20, abc: 4, rc: 5, ec: 10, ecd: -5, ls: 80, tp: 83, cc: 85, hours: 30},
        {ecc: 18, abc: 3, rc: 6, ec: 20, ecd: -14, ls: 90, tp: 40, cc: 95, hours: 40},
      ]
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats[0])
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats[1])

      const player = await this.fetchPlayer()

      expect(player.stats.ecc).to.eq(38)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats[0],
        [this.projectIds[1]]: projectStats[1],
      })
    })

    it('when called for the same project more than once, the result is the same as if only the last call were made', async function () {
      // Initialize the player with an ECC of 10
      const projectStats1 = {ecc: 10, abc: 2, rc: 5, ec: 10, ecd: -5, ls: 80, tp: 83, cc: 85, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats1)

      // Add 20 for a project
      const projectStats2 = {ecc: 20, abc: 4, rc: 5, ec: 10, ecd: -5, ls: 90, tp: 40, cc: 95, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats2)
      expect(await this.fetchPlayer()).to.have.deep.property('stats.ecc', 30)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(projectStats2)

      // Change the ECC for that project to 10
      const projectStats3 = {ecc: 10, abc: 2, rc: 5, ec: 10, ecd: -5, ls: 95, tp: 65, cc: 97, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats3)
      expect(await this.fetchPlayer()).to.have.deep.property('stats.ecc', 20)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(projectStats3)
    })
  })
})
