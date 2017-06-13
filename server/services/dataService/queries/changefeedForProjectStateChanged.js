import r from '../r'

export default function changefeedForProjectStateChanged() {
  return r.table('projects').changes()
    .filter(
      r.row('old_val').eq(null)  // new rows
        .or(r.row('new_val')('state').ne(r.row('old_val')('state')))  // state changes
    )
}
