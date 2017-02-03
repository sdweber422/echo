/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import Promise from 'bluebird'
import {connect} from 'src/db'
import {range} from 'src/server/util'
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import {
  getPlayerById,
  reassignPlayersToChapter,
  savePlayerProjectStats,
} from 'src/server/db/player'

const r = connect()

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
      this.player = await factory.create('player', {stats: {effectiveContributionCycles: 0}})
      this.fetchPlayer = () => getPlayerById(this.player.id)
    })

    it('creates the stats.effectiveContributionCycles attribute if missing', async function () {
      const projectStats = {effectiveContributionCycles: 40, aggregateBuildCycles: 4, relativeContribution: 10, technicalHealth: 80, teamPlay: 83, cultureContribution: 90, hours: 35, ec: 15, ecd: -5}
      await getPlayerById(this.player.id).replace(p => p.without('stats'))
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.effectiveContributionCycles).to.eq(40)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats,
      })
    })

    it('adds to the existing cumulative stats.effectiveContributionCycles', async function () {
      expect(this.player).to.have.deep.property('stats.effectiveContributionCycles')

      const projectStats = {effectiveContributionCycles: 20, aggregateBuildCycles: 4, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 80, teamPlay: 83, cultureContribution: 85, hours: 30}
      await getPlayerById(this.player.id).update({stats: {effectiveContributionCycles: 10}})
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.effectiveContributionCycles).to.eq(30)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[1]]: projectStats,
      })
    })

    it('creates the stats.projects attribute if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectStats = {effectiveContributionCycles: 20, aggregateBuildCycles: 4, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 80, teamPlay: 83, cultureContribution: 85, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats)

      const player = await this.fetchPlayer()

      expect(player.stats.effectiveContributionCycles).to.eq(20)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats,
      })
    })

    it('adds a project entry to the stats if neccessary', async function () {
      expect(this.player).to.not.have.deep.property('stats.projects')

      const projectStats = [
        {effectiveContributionCycles: 20, aggregateBuildCycles: 4, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 80, teamPlay: 83, cultureContribution: 85, hours: 30},
        {effectiveContributionCycles: 18, aggregateBuildCycles: 3, relativeContribution: 6, ec: 20, ecd: -14, technicalHealth: 90, teamPlay: 40, cultureContribution: 95, hours: 40},
      ]
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats[0])
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats[1])

      const player = await this.fetchPlayer()

      expect(player.stats.effectiveContributionCycles).to.eq(38)
      expect(player.stats.projects).to.deep.eq({
        [this.projectIds[0]]: projectStats[0],
        [this.projectIds[1]]: projectStats[1],
      })
    })

    it('adds a statsComputedAt timestamp', async function () {
      expect(await this.fetchPlayer()).to.not.have.property('statsComputedAt')

      await savePlayerProjectStats(this.player.id, this.projectIds[0], {effectiveContributionCycles: 10})

      expect(await this.fetchPlayer()).to.have.property('statsComputedAt')
    })

    it('when called for the same project more than once, the result is the same as if only the last call were made', async function () {
      // Initialize the player with an ECC of 10
      const projectStats1 = {effectiveContributionCycles: 10, aggregateBuildCycles: 2, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 80, teamPlay: 83, cultureContribution: 85, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[0], projectStats1)

      // Add 20 for a project
      const projectStats2 = {effectiveContributionCycles: 20, aggregateBuildCycles: 4, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 90, teamPlay: 40, cultureContribution: 95, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats2)
      expect(await this.fetchPlayer()).to.have.deep.property('stats.effectiveContributionCycles', 30)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(projectStats2)

      // Change the ECC for that project to 10
      const projectStats3 = {effectiveContributionCycles: 10, aggregateBuildCycles: 2, relativeContribution: 5, ec: 10, ecd: -5, technicalHealth: 95, teamPlay: 65, cultureContribution: 97, hours: 30}
      await savePlayerProjectStats(this.player.id, this.projectIds[1], projectStats3)
      expect(await this.fetchPlayer()).to.have.deep.property('stats.effectiveContributionCycles', 20)
      expect(await this.fetchPlayer()).to.have.deep.property(`stats.projects.${this.projectIds[1]}`).deep.eq(projectStats3)
    })

    it('computes and stores weighted averages of any numbers in stats (last 6 projects)', async function () {
      const chapterId = this.player.chapterId
      const cycleAttrs = range(1, 8).map(cycleNumber => ({cycleNumber, chapterId}))
      const cycles = await factory.createMany('cycle', cycleAttrs)
      const projectAttrs = cycles.map(cycle => ({cycleId: cycle.id, chapterId}))
      const projects = await factory.createMany('project', projectAttrs)

      const projectStats = [
        {a: 2, b: 5, c: 9},
        {a: 3, b: 5, c: 9},
        {a: 4, b: 5, c: 1},
        {a: 5, b: 5, c: 1},
        {a: 6, b: 5, c: 2},
        {a: 7, b: 5, c: 2},
        {a: 8, b: 5, c: 3},
        {a: 9, b: 5, c: 3},
      ]
      await Promise.each(projectStats, (stats, i) => {
        return savePlayerProjectStats(this.player.id, projects[i].id, stats)
      })

      const player = await this.fetchPlayer()

      expect(player.stats.weightedAverages).to.deep.eq({
        a: 6.5, b: 5, c: 2
      })
    })
  })
})
