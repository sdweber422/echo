import url from 'url'
import rethinkdbdash from 'rethinkdbdash'
import config from 'src/config'

// needed for migrations to run properly
global.__CLIENT__ = false
global.__SERVER__ = true

// FIXME: janky singleton; relying on module caching
let r = null

const dbCert = config.server.rethinkdb.connections.cert
const dbUrl = config.server.rethinkdb.connections.url
const {hostname, port, pathname, auth} = url.parse(dbUrl)

export const options = {
  host: hostname,
  port: parseInt(port, 10),
  db: pathname ? pathname.slice(1) : undefined,
  authKey: auth ? auth.split(':')[1] : undefined,
  ssl: dbCert ? {ca: dbCert} : undefined,
}

export function connect() {
  r = r || rethinkdbdash({
    servers: [options],
    silent: true,
    max: 100,
    buffer: 10,
  })
  return r
}

export async function create() {
  try {
    const r = connect()
    const result = await r.dbCreate(options.db).run()
    console.log(`Successfully created database '${options.db}'.`)
    return result
  } catch (err) {
    console.error(err.stack)
  }
}

export async function drop() {
  try {
    const r = connect()
    const result = await r.dbDrop(options.db).run()
    console.log(`Successfully dropped database '${options.db}'.`)
    return result
  } catch (err) {
    console.error(err.stack)
  }
}
