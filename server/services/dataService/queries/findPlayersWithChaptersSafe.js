import r from '../r'

export default function findPlayersWithChaptersSafe() {
  return r.table('players')
    .eqJoin('chapterId', r.table('chapters'))
    .without({left: 'chapterId'}, {right: 'inviteCodes'})
    .map(doc => doc('left').merge({chapter: doc('right')}))
    .run()
}
