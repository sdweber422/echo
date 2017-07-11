/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */
import {Cycle} from 'src/server/services/dataService'
import {PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'
import {resetDB} from 'src/test/helpers'
import {expectArraysToContainTheSameElements} from 'src/test/helpers/expectations'
import factory from 'src/test/factories'

import findActiveProjectsForChapter from '../findActiveProjectsForChapter'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('set up chapter, cycle, project', async function () {
    this.chapter = await factory.create('chapter')
    this.cycle = await factory.create('cycle', {chapterId: this.chapter.id})
    this.projects = await factory.createMany('project', {
      chapterId: this.chapter.id,
      cycleId: this.cycle.id,
    }, 3)
  })

  it('retrieves projects in the latest cycle if in PRACTICE state', async function () {
    await Cycle.get(this.cycle.id).updateWithTimestamp({state: PRACTICE})
    const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
    expectArraysToContainTheSameElements(
      activeProjects.map(p => p.id),
      this.projects.map(p => p.id),
    )
  })

  it('retrieves projects in the latest cycle if in REFLECTION state', async function () {
    await Cycle.get(this.cycle.id).updateWithTimestamp({state: REFLECTION})
    const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
    expectArraysToContainTheSameElements(
      activeProjects.map(p => p.id),
      this.projects.map(p => p.id),
    )
  })

  it('retrieves projects in the latest cycle AND a specific phase if specified', async function () {
    await Cycle.get(this.cycle.id).updateWithTimestamp({state: PRACTICE})

    const [phaseYes, phaseNo] = await factory.createMany('phase', 2)
    const [phaseYesProjects] = await Promise.all([
      factory.createMany('project', {
        chapterId: this.chapter.id,
        cycleId: this.cycle.id,
        phaseId: phaseYes.id,
      }, 3),
      factory.createMany('project', {
        chapterId: this.chapter.id,
        cycleId: this.cycle.id,
        phaseId: phaseNo.id,
      }, 2)
    ])

    const activeProjectsInPhase = await findActiveProjectsForChapter(this.chapter.id, {filter: {phaseId: phaseYes.id}})
    expectArraysToContainTheSameElements(
      activeProjectsInPhase.map(p => p.id),
      phaseYesProjects.map(p => p.id),
    )
  })

  it('does not retrieve projects in the latest cycle if in COMPLETE state', async function () {
    await Cycle.get(this.cycle.id).updateWithTimestamp({state: COMPLETE})
    const activeProjects = await findActiveProjectsForChapter(this.chapter.id)
    expect(activeProjects.length).to.eq(0)
  })

  it('returns count if specified', async function () {
    await Cycle.get(this.cycle.id).updateWithTimestamp({state: PRACTICE})
    const activeProjectCount = await findActiveProjectsForChapter(this.chapter.id, {count: true})
    expect(activeProjectCount).to.eq(this.projects.length)
  })
})
