/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {GOAL_SELECTION} from '../../../common/models/cycle'
import {
  getCycleById,
  findCycles,
  getCyclesInStateForChapter,
  getLatestCycleForChapter,
  createNextCycleForChapter,
} from '../cycle'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  before('define createChapterWithCycles helper', function () {
    this.createChapterWithCycles = (cycleAttrs = {}) => {
      const now = new Date()
      return factory.create('chapter')
        .then(chapter => {
          this.chapter = chapter
          const overwriteObjs = Array.from(Array(4).keys()).map(i => {
            const startTimestamp = new Date(now)
            startTimestamp.setDate(startTimestamp.getDate() + (i * 7))
            return Object.assign({}, {
              chapterId: chapter.id,
              startTimestamp,
            }, cycleAttrs)
          })
          return factory.createMany('cycle', overwriteObjs)
            .then(cycles => {
              this.cycles = cycles
            })
        })
    }
  })

  describe('getCycleById', function () {
    beforeEach(function () {
      return factory.create('cycle').then(cycle => {
        this.cycle = cycle
      })
    })

    it('returns a shallow cycle by default', function () {
      return getCycleById(this.cycle.id)
        .then(cycle => {
          expect(cycle).to.have.property('chapterId')
          expect(cycle).to.not.have.property('chapter')
        })
    })

    it('merges in the chapter info when requested', function () {
      return getCycleById(this.cycle.id, {mergeChapter: true})
        .then(cycle => {
          expect(cycle).to.not.have.property('chapterId')
          expect(cycle).to.have.property('chapter')
          expect(cycle.chapter).to.have.property('id')
          expect(cycle.chapter).to.have.property('name')
        })
    })
  })

  describe('findCycles', function () {
    beforeEach(function () {
      return factory.createMany('chapter', 2)
        .then(chapters => {
          this.chapters = chapters
          const chapterIdObjs = Array.from(Array(4).keys()).map(i => {
            return {chapterId: chapters[i % 2].id}
          })
          return factory.createMany('cycle', chapterIdObjs)
            .then(cycles => {
              this.cycles = cycles
            })
        })
    })

    it('returns only the requested cycles', function () {
      return findCycles({chapterId: this.chapters[0].id})
        .then(cycles => {
          expect(cycles.length).to.equal(2)
        })
    })
  })

  describe('getCyclesInStateForChapter', function () {
    beforeEach(function () {
      return this.createChapterWithCycles({state: GOAL_SELECTION})
    })

    it('returns the list of cycles in a given state with most recent first', function () {
      return getCyclesInStateForChapter(this.chapter.id, GOAL_SELECTION)
        .then(cycles => {
          expect(cycles.length).to.equal(4)
          expect(cycles[0].startTimestamp).to.be.above(cycles[1].startTimestamp)
        })
    })
  })

  describe('createNextCycleForChapter', function () {
    beforeEach(function () {
      return this.createChapterWithCycles()
    })

    it('creates a new cycle for this chapter', function () {
      return createNextCycleForChapter(this.chapter.id)
        .then(cycle => {
          expect(cycle.state).to.equal(GOAL_SELECTION)
          expect(cycle.chapterId).to.equal(this.chapter.id)
          expect(cycle.cycleNumber).to.equal(this.cycles[this.cycles.length - 1].cycleNumber + 1)
          expect(cycle.startTimestamp.getTime()).to.equal(cycle.createdAt.getTime())
        })
    })
  })
  describe('getLatestCycleForChapter', function () {
    beforeEach(function () {
      return this.createChapterWithCycles()
    })

    it('returns the newest cycle for the given chapter', function () {
      return getLatestCycleForChapter(this.chapter.id)
        .then(cycle => {
          expect(cycle.id).to.equal(this.cycles[3].id)
          expect(cycle.startTimestamp.getTime()).to.equal(this.cycles[3].startTimestamp.getTime())
        })
    })
  })
})
