import r from '../r'

export default function mapStatsByDescriptor() {
  const addToResult = (result, stat) => result.merge(r.object(stat('descriptor'), stat))

  return r.table('stats').reduce((left, right) =>
    r.branch(
      left.hasFields('id').and(right.hasFields('id')),
      r.object(left('descriptor'), left, right('descriptor'), right),
      left.hasFields('id'),
      addToResult(right, left),
      right.hasFields('id'),
      addToResult(left, right),
      left.merge(right)
    )
  )
}
