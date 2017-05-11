import r from '../r'

export default function findCyclesWithChaptersSafe() {
  return r.table('cycles')
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .execute()
}
