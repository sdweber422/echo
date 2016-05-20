/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, pending} from '../../../test/helpers'

import formProjectTeams from '../formProjectTeams'

describe(testContext(__filename), function () {
  withDBCleanup()

  pending('creates Teams', async function () {
    try {
      const cycle = await factory.create('cycle')
      const players = await factory.createMany('player', 5, {chapterId: cycle.chapterId})
      const votes = await factory.createMany('vote', 5,
        [[1,2], [1,2], [2,3], [3,4], [3,4]].map(
          ([a,b], i) => ({
            cycleId: cycle.id,
            playerId: players[i],
            goals: [
              {url: `http://ex.co/${a}`, title: `Goal ${a}`},
              {url: `http://ex.co/${b}`, title: `Goal ${b}`},
            ]
          })
        )
      )

      const result = await formProjectTeams(cycle)
      const createdProjects = await r.table('projects').run()
      expect(createdProjects).to.have.length(2)

      const goal1Project = createdProjects.filter(p => p.goalUrl.endsWith('1'))
      expect(goal1Project).to.exist
      expect(goal1Project.name).to.match(/^\w+-\w+-\d$/)

      const goal3Project = createdProjects.filter(p => p.goalUrl.endsWith('3'))
      expect(goal3Project).to.exist
      expect(goal3Project.name).to.match(/^\w+-\w+-\d$/)

      const goal1ProjectTeam = goal1Project.cycleTeams[cycle.id].sort()
      expect(goal1ProjectTeam).to.deep.equal(players.slice(0, 2))

      // The middle player voted for both slots, but should get their first choice
      const goal3ProjectTeam = goal3Project.cycleTeams[cycle.id].sort()
      expect(goal3ProjectTeam).to.deep.equal(players.slice(3, 5))

    } catch (e) {
      throw(e)
    }
  })
  it('makes sure team has at least one highly skilled player')
})
