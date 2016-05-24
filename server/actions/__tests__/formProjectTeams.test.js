/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {GOAL_SELECTION} from '../../../common/models/cycle'
const {formProjectTeams, forTesting: {getTeamSizes}} = require('../formProjectTeams')

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('formProjectTeams', function () {
    beforeEach(async function() {
      try {
        this.cycle = await factory.create('cycle', {state: GOAL_SELECTION})
        this.players = await factory.createMany('player', {chapterId: this.cycle.chapterId}, 6)
        this.mostPopularGoalIssueNums = [1, 3]
        await factory.createMany('vote',
          [
            [this.mostPopularGoalIssueNums[0], 2],
            [this.mostPopularGoalIssueNums[0], 2],
            [this.mostPopularGoalIssueNums[0], this.mostPopularGoalIssueNums[1]],
            [this.mostPopularGoalIssueNums[1], 4],
            [this.mostPopularGoalIssueNums[1], 4],
            [6, 7]
          ].map(
            ([a, b], i) => ({
              cycleId: this.cycle.id,
              playerId: this.players[i].id,
              goals: [
                {url: `http://ex.co/${a}`, title: `Goal ${a}`},
                {url: `http://ex.co/${b}`, title: `Goal ${b}`},
              ]
            })
          ),
          6,
        )
      } catch (e) {
        throw (e)
      }
    })

    it('creates teams based on player votes', async function () {
      try {
        await formProjectTeams(this.cycle.id)

        const createdProjects = await r.table('projects').run()
        expect(createdProjects).to.have.length(2)

        this.mostPopularGoalIssueNums.forEach(i => {
          const project = createdProjects.filter(p => p.goalUrl.endsWith(i))[0]
          expect(project).to.exist
          expect(project.name).to.match(/^\w+-\w+(-\d)?$/)
        })
      } catch (e) {
        throw (e)
      }
    })
    describe('when not everyone voted', function() {
      beforeEach(async function() {
        return factory.create('player', {chapterId: this.cycle.chapterId})
          .then(player => this.players.push(player))
      })
      it.only('places all players in teams', function() {
        return formProjectTeams(this.cycle.id)
          .then(() => r.table('projects'))
          .then(projects => projects.map(p => p.cycleTeams[this.cycle.id].playerIds))
          .then(teams => teams.reduce((a,b) => a.concat(b), []))
          .then(playersInTeams => expect(playersInTeams.length).to.equal(this.players.length))
      })
    })
    it('each team has at least one highly skilled player')
  })

  describe('getTeamSizes(playerCount, target)', function () {
    it('determines optimal team sizes based on playerCount', function () {
      expect(getTeamSizes(6).sort()).to.deep.equal([3, 3].sort())
      expect(getTeamSizes(9).sort()).to.deep.equal([5, 4].sort())
      expect(getTeamSizes(11).sort()).to.deep.equal([4, 4, 3].sort())
      expect(getTeamSizes(12).sort()).to.deep.equal([4, 4, 4].sort())
      expect(getTeamSizes(13).sort()).to.deep.equal([4, 4, 5].sort())
      expect(getTeamSizes(14).sort()).to.deep.equal([4, 5, 5].sort())
    })
  })
})
