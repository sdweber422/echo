/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {
  resetDB,
  runGraphQLQuery,
  useFixture,
  mockIdmUsersById,
  expectArraysToContainTheSameElements,
} from 'src/test/helpers'

import fields from '../index'

const query = `
  query {
    findPhaseSummaries {
      phase {
        id
        number
      }
      currentProjects {
        id
        name
        memberIds
      }
      currentMembers {
        id
        name
        handle
      }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Setup test data', async function () {
    useFixture.nockClean()
    const chapter = await factory.create('chapter')
    const cycle = await factory.create('cycle', {
      chapterId: chapter.id,
      state: 'PRACTICE',
    })
    this.phases = await factory.createMany('phase', 3)
    this.members = await factory.createMany('member', {
      chapterId: chapter.id,
      phaseId: this.phases[0].id,
    }, 4)
    const memberIds = this.members.map(m => m.id)
    this.project = await factory.create('project', {
      memberIds,
      chapterId: chapter.id,
      cycleId: cycle.id,
      phaseId: this.phases[0].id,
    })
    const users = await mockIdmUsersById(memberIds, null, {strict: true, times: 10})
    this.currentUser = users[0]
  })

  it('returns all phase summaries', async function () {
    const result = await runGraphQLQuery(
      query,
      fields,
      null,
      {currentUser: this.currentUser},
    )

    const phaseSummaries = result.data.findPhaseSummaries
    expect(phaseSummaries.length).to.eq(this.phases.length)
    expectArraysToContainTheSameElements(
      phaseSummaries.map(summary => summary.phase.id),
      this.phases.map(p => p.id)
    )

    const summaryWithProject = phaseSummaries.find(ps => ps.phase.id === this.phases[0].id)
    expect(summaryWithProject.currentProjects.length).to.equal(1)
    expect(summaryWithProject.currentMembers.length).to.equal(this.members.length)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, fields, {identifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
