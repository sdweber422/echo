import r from '../r'

export default function getStatById(id) {
  return r.table('stats').get(id)
}
