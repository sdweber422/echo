/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import factory from 'src/test/factories'
import {resetDB, useFixture} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'

import {processCycleLaunched} from '../worker'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  describe('processCycleLaunched()', function () {
    describe('when a cycle has been launched', function () {
      beforeEach(async function () {
        this.chapter = await factory.create('chapter')
        this.cycle = await factory.create('cycle', {chapterId: this.chapter.id, cycleNumber: 3})
        this.pool = await factory.create('pool', {cycleId: this.cycle.id})
      })

      it('does not throw an error when no votes have been submitted', function () {
        return expect(processCycleLaunched(this.cycle)).to.not.be.rejected
      })

      it('automatically creates single-member projects for users in non-voting phases', async function () {
        const practiceGoalNumber = 1
        const phase = await factory.create('phase', {number: 1, practiceGoalNumber})
        const phasePlayers = await factory.createMany('player', {chapterId: this.chapter.id, phaseId: phase.id}, 2)

        useFixture.nockClean()
        useFixture.nockGetGoalInfo(practiceGoalNumber)

        await processCycleLaunched(this.cycle)

        const phaseProjects = await Project.filter({cycleId: this.cycle.id, phaseId: phase.id})
        expect(phaseProjects.length).to.eq(phasePlayers.length)

        const phasePlayerIds = phasePlayers.map(p => p.id)
        phaseProjects.forEach(project => {
          expect(project.goal.number).to.eq(phase.practiceGoalNumber)
          expect(project.playerIds.length).to.eq(1)
          expect(phasePlayerIds.includes(project.playerIds[0])).to.eq(true)
        })
      })
    })
  })
})
