import r from '../../db/connect'
import {CYCLE_STATES} from '../../common/models/cycle'
import {insertIntoTable} from '../../server/db/util'

import {customQueryError} from './errors'

export const cyclesTable = r.table('cycles')

export function getCycleById(cycleId, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const cycle = cyclesTable.get(cycleId)
  return options.mergeChapter ?
    cycle
      .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
      .without('chapterId') :
    cycle
}

export function findCycles(filter = {}) {
  return cyclesTable.filter(filter)
}

// find the list of cycles for a given chapter in a particular state,
export function getCyclesInStateForChapter(chapterId, state) {
  return r.table('cycles')
    .getAll([chapterId, state], {index: 'chapterIdAndState'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy(r.desc('cycleNumber'))
}

export function getLatestCycleForChapter(chapterId) {
  return getLatestCycleForChapterUnsafe(chapterId)
    .default(customQueryError(`No cycles found for chapter with id ${chapterId}.`))
}

function getLatestCycleForChapterUnsafe(chapterId) {
  return cyclesTable
    .between([chapterId, r.minval], [chapterId, r.maxval], {index: 'chapterIdAndState'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy(r.desc('cycleNumber'))
    .nth(0)
}

export function createNextCycleForChapter(chapterId) {
  return insert({
    chapterId,
    startTimestamp: r.now(),
    cycleNumber: getNextCycleNumberForChapter(chapterId),
    state: CYCLE_STATES[0]
  }, {returnChanges: true})
  .then(result => result.changes[0].new_val)
}

function getNextCycleNumberForChapter(chapterId) {
  return getLatestCycleForChapterUnsafe(chapterId)
    .default({cycleNumber: 0})('cycleNumber')
    .add(1)
}

export function insert(cycle, options) {
  return insertIntoTable(cycle, cyclesTable, options)
}
