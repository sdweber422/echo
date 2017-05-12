import r from '../r'

export default async function create(dbName) {
  try {
    const result = await r.dbCreate(dbName).run()
    console.log(`Successfully created database '${dbName}'.`)
    return result
  } catch (err) {
    console.error(err.stack)
  }
}
