import r from '../../db/connect'

import {customQueryError} from './errors'

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
    .getAll(chapterId, {index: 'chapterId'})
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .orderBy(r.desc('startTimestamp'))
    .nth(0)
    .default(customQueryError(`No cycles found for chapter with id ${chapterId}.`))
}

export function getCycleById(cycleId) {
  return r.table('cycles')
    .get(cycleId)
    .merge({chapter: r.table('chapters').get(r.row('chapterId'))})
    .without('chapterId')
}
