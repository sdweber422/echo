import r from '../r'
import {customQueryError} from '../util'

export default function getStatByDescriptor(descriptor) {
  return r.table('stats').getAll(descriptor, {index: 'descriptor'})
    .nth(0)
    .default(customQueryError(`No Stat found with descriptor ${descriptor}`))
}
