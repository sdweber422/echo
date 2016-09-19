/* eslint-disable no-var, no-console */
var url = require('url')

var config = require('src/config')

var run = !module.parent

function configure(dbUrl, dbCert) {
  dbUrl = dbUrl || config.server.rethinkdb.url
  dbCert = dbCert || config.server.rethinkdb.cert
  var dbConfig
  var parsedUrl = url.parse(dbUrl)
  dbConfig = {
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port, 10),
    db: parsedUrl.pathname ? parsedUrl.pathname.slice(1) : undefined,
    authKey: parsedUrl.auth ? parsedUrl.auth.split(':')[1] : undefined,
  }
  if (dbCert) {
    dbConfig.ssl = {
      ca: dbCert
    }
  }

  return dbConfig
}

var createOptions = {
  replicas: config.server.rethinkdb.replicas
}

if (run) {
  console.log(JSON.stringify(configure()))
}

module.exports = configure
module.exports.createOptions = createOptions
