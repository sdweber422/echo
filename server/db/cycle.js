import r from 'src/db/connect'
import {CYCLE_STATES, COMPLETE} from 'src/common/models/cycle'
import {insertIntoTable, updateInTable} from 'src/server/db/util'

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

export function getLatestCycleForChapter(chapterId, passedOptions = {}) {
  const cycleQuery = getLatestCycleForChapterUnsafe(chapterId)
    .default(customQueryError('No cycles found for chapter.'))

  if (!passedOptions.mergeChapter) {
    return cycleQuery
  }

  return cycleQuery.merge({
    chapter: r.table('chapters').get(r.row('chapterId')).without('inviteCodes')
  }).without('chapterId')
}

function getLatestCycleForChapterUnsafe(chapterId) {
  return getCyclesForChapter(chapterId).nth(0)
}

export function getCyclesForChapter(chapterId) {
  return cyclesTable
    .between([chapterId, r.minval], [chapterId, r.maxval], {index: 'chapterIdAndState'})
    .orderBy(r.desc('cycleNumber'))
}

export async function createNextCycleForChapter(chapterId) {
  const latestCycle = await completeLatestCycle(chapterId)
  const newCycleNumber = (latestCycle && latestCycle.cycleNumber + 1) || 1

  const result = await insert({
    chapterId,
    startTimestamp: r.now(),
    cycleNumber: newCycleNumber,
    state: CYCLE_STATES[0]
  }, {returnChanges: true})

  return result.changes[0].new_val
}

async function completeLatestCycle(chapterId) {
  const latestCycle = await getCyclesForChapter(chapterId).nth(0).default(null)

  if (!latestCycle) {
    return
  }

  const result = await update({
    id: latestCycle.id,
    endTimestamp: r.now(),
    state: COMPLETE
  }, {returnChanges: true})

  return result.changes[0].new_val
}

export function update(cycle, options) {
  return updateInTable(cycle, cyclesTable, options)
}

export function insert(cycle, options) {
  return insertIntoTable(cycle, cyclesTable, options)
}
