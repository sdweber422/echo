/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import nock from 'nock'
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, useFixture} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import {Project} from 'src/server/services/dataService'

import fields from '../index'

const query = `
  query($cycleNumber: Int) {
    findProjectsForCycle(cycleNumber: $cycleNumber) {
      id
      chapter { id }
      cycle { id }
      phase { id number }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Create current user', async function () {
    nock.cleanAll()

    const user = await factory.build('user')
    const chapter = await factory.create('chapter')
    const phase = await factory.create('phase', {number: 2})
    await factory.create('member', {id: user.id, chapterId: chapter.id, phaseId: phase.id})

    // generate extra projects in another cycle in the member's chapter
    const firstCycle = await factory.create('cycle', {chapterId: chapter.id, state: 'COMPLETE'})
    await factory.createMany('project', {chapterId: chapter.id, cycleId: firstCycle.id, phaseId: phase.id}, 4)

    this.cycle = await factory.create('cycle', {chapterId: chapter.id, cycleNumber: firstCycle.cycleNumber + 1, state: 'PRACTICE'})
    this.projects = await factory.createMany('project', {chapterId: chapter.id, cycleId: this.cycle.id, phaseId: phase.id}, 3)
    this.chapter = chapter
    this.phase = phase
    this.currentUser = user
  })

  it('returns correct projects for cycle number', async function () {
    const result = await runGraphQLQuery(
      query,
      fields,
      {cycleNumber: this.cycle.number},
      {currentUser: this.currentUser},
    )
    const returnedProjects = result.data.findProjectsForCycle
    expect(returnedProjects.length).to.equal(this.projects.length)
    expect(returnedProjects.find(p => p.id === this.projects[0].id)).to.be.ok
    expect(returnedProjects[0].chapter.id).to.equal(this.chapter.id)
    expect(returnedProjects[0].cycle.id).to.equal(this.cycle.id)
    expect(returnedProjects[0].phase.id).to.equal(this.phase.id)
  })

  it('returns projects for current cycle no cycle number specified', async function () {
    const currentCycleProjects = await Project.filter({cycleId: this.cycle.id})
    useFixture.nockIDMGetUser(this.currentUser)
    const {data: {findProjectsForCycle: result}} = await runGraphQLQuery(
      query,
      fields,
      null,
      {currentUser: this.currentUser},
    )
    expect(result.length).to.equal(currentCycleProjects.length)
    expectArraysToContainTheSameElements(currentCycleProjects.map(p => p.id), result.map(p => p.id))
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, null, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
