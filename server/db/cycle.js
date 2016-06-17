import r from '../../db/connect'

import {customQueryError} from './errors'

export function getCycleById(cycleId, passedOptions = {}) {
  const options = Object.assign({
    mergeChapter: false,
  }, passedOptions)
  const cycle = r.table('cycles').get(cycleId)
  return options.mergeChapter ?
    cycle
      .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
      .without('chapterId') :
    cycle
}

export function findCycles(filter = {}) {
  return r.table('cycles').filter(filter)
}

// find the list of cycles for a given chapter in a particular state,
// ordered by startTimestamp
export function getCyclesInStateForChapter(chapterId, state) {
  return r.table('cycles')
    .getAll([chapterId, state], {index: 'chapterIdAndState'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy(r.desc('startTimestamp'))
}

export function getLatestCycleForChapter(chapterId) {
  return r.table('cycles')
    .between([chapterId, r.minval], [chapterId, r.maxval], {index: 'chapterIdAndState'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy(r.desc('startTimestamp'))
    .nth(0)
    .default(customQueryError(`No cycles found for chapter with id ${chapterId}.`))
}
