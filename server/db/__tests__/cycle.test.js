/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {connect} from 'src/db'
import {GOAL_SELECTION, COMPLETE} from 'src/common/models/cycle'
import {
  getCycleById,
  findCycles,
  getCyclesInStateForChapter,
  getLatestCycleForChapter,
  createNextCycleForChapter,
} from 'src/server/db/cycle'
import {withDBCleanup} from 'src/test/helpers'
import factory from 'src/test/factories'

const r = connect()

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

    function _itCreatesANewCycle() {
      it('creates a new cycle for this chapter', async function () {
        const beginTimestamp = Date.now()
        const cycle = await createNextCycleForChapter(this.chapter.id)
        expect(cycle.state).to.equal(GOAL_SELECTION)
        expect(cycle.chapterId).to.equal(this.chapter.id)
        expect(cycle.cycleNumber).to.equal(
          this.cycles.length ?
            this.cycles[this.cycles.length - 1].cycleNumber + 1 :
            1
        )
        expect(cycle.startTimestamp.getTime()).to.gt(beginTimestamp)
        expect(cycle.createdAt.getTime()).to.gt(beginTimestamp)
        expect(cycle.updatedAt.getTime()).to.gt(beginTimestamp)
      })
    }

    _itCreatesANewCycle()

    it('moves the previous cycle to COMPLETE', async function () {
      const beginTimestamp = Date.now()
      let previousCycle = this.cycles[this.cycles.length - 1]
      expect(previousCycle.state).to.not.eq(COMPLETE)
      expect(previousCycle.endTimestamp).to.not.exist
      expect(previousCycle.updatedAt.getTime()).to.not.gt(beginTimestamp)

      await createNextCycleForChapter(this.chapter.id)

      previousCycle = await getCycleById(previousCycle.id)
      expect(previousCycle.state).to.eq(COMPLETE)
      expect(previousCycle.endTimestamp.getTime()).to.gt(beginTimestamp)
      expect(previousCycle.updatedAt.getTime()).to.gt(beginTimestamp)
    })

    describe('when there are no prior cycles', function () {
      beforeEach(function () {
        this.cycles = []
        return r.table('cycles').delete()
      })
      _itCreatesANewCycle()
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
