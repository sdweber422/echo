/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
var util = require('util');
function debug(x) {
  console.log(util.inspect(x, {showHidden: false, depth: null}))
}

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, pending} from '../../../test/helpers'

import {GOAL_SELECTION} from '../../../common/models/cycle'
const {formProjectTeams, forTesting: {getTeamSizes}} = require('../formProjectTeams')

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('formProjectTeams', function() {
    it.only('creates teams based on player votes', async function () {
      try {
        const cycle = await factory.create('cycle', {state: GOAL_SELECTION})
        const players = await factory.createMany('player', {chapterId: cycle.chapterId}, 6)
        const votes = await factory.createMany('vote',
          [[1,2], [1,2], [1,3], [3,4], [3,4], [6,7]].map(
            ([a,b], i) => ({
              cycleId: cycle.id,
              playerId: players[i].id,
              goals: [
                {url: `http://ex.co/${a}`, title: `Goal ${a}`},
                {url: `http://ex.co/${b}`, title: `Goal ${b}`},
              ]
            })
          ),
          6,
        )
        debug({votes})

        const result = await formProjectTeams(cycle.id)
        const createdProjects = await r.table('projects').run()
        console.log({createdProjects})
        expect(createdProjects).to.have.length(2)

        const goal1Project = createdProjects.filter(p => p.goalUrl.endsWith('1'))[0]
        expect(goal1Project).to.exist
        expect(goal1Project.name).to.match(/^\w+-\w+(-\d)?$/)

        const goal3Project = createdProjects.filter(p => p.goalUrl.endsWith('3'))[0]
        expect(goal3Project).to.exist
        expect(goal3Project.name).to.match(/^\w+-\w+(-\d)?$/)

        const goal1ProjectTeam = goal1Project.cycleTeams[cycle.id].playerIds.sort()
        console.log({goal1ProjectTeam})
        expect(goal1ProjectTeam).to.deep.equal(players.map(p => p.id).slice(0, 3))

        // The middle player voted for both slots, but should get their first choice
        const goal3ProjectTeam = goal3Project.cycleTeams[cycle.id].playerIds.sort()
        console.log({goal3ProjectTeam})
        expect(goal3ProjectTeam).to.deep.equal(players.map(p => p.id).slice(4, 6))

      } catch (e) {
        throw(e)
      }
    })
    it('players who did not vote are assigned to teams')
    it('each team has at least one highly skilled player')
  })

  describe('getTeamSizes(playerCount, target)', function() {

    it('determines optimal team sizes based on playerCount', function() {
      expect(getTeamSizes(6).sort()).to.deep.equal([3,3].sort())
      expect(getTeamSizes(9).sort()).to.deep.equal([5,4].sort())
      expect(getTeamSizes(11).sort()).to.deep.equal([4,4,3].sort())
      expect(getTeamSizes(12).sort()).to.deep.equal([4,4,4].sort())
      expect(getTeamSizes(13).sort()).to.deep.equal([4,4,5].sort())
      expect(getTeamSizes(14).sort()).to.deep.equal([4,5,5].sort())
    })

  })
})

