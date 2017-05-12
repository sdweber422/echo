import dbConfig from 'src/config/db'

import r from '../r'

export default async function drop() {
  try {
    const result = await r.dbDrop(dbConfig.db).run()
    console.log(`Successfully dropped database '${dbConfig.db}'.`)
    return result
  } catch (err) {
    console.error(err.stack)
  }
}
