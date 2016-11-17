/* eslint-disable no-console, no-undef, no-unused-vars */
import http from 'http'
import path from 'path'
import Express from 'express'
import serveStatic from 'serve-static'
import {HTTPS as https} from 'express-sslify'
import cookieParser from 'cookie-parser'
import raven from 'raven'

import config from 'src/config'
import configureApp from './configureApp'
import configureSocketCluster from './configureSocketCluster'

import {default as renderApp} from './render'

export function start() {
  // capture unhandled exceptions
  raven.patchGlobal(config.server.sentryDSN)

  const app = new Express()
  const httpServer = http.createServer(app)

  configureApp(app)

  // parse cookies
  app.use(cookieParser())

  // ensure secure connection
  if (config.server.secure) {
    /* eslint new-cap: [2, {"capIsNewExceptions": ["HTTPS"]}] */
    app.use(https({trustProtoHeader: true}))
  }

  // static files
  app.use(serveStatic(path.join(__dirname, '../dist')))
  app.use(serveStatic(path.join(__dirname, '../public')))

  // handle auth requests
  app.use((req, res, next) => {
    require('./auth')(req, res, next)
  })

  // handle report requests
  app.use((req, res, next) => {
    require('./reports')(req, res, next)
  })

  // handle GraphQL requests
  app.use((req, res, next) => {
    require('./graphql')(req, res, next)
  })

  // handle requests to look at job queues
  app.use((req, res, next) => {
    require('./jobQueuesUI')(req, res, next)
  })

  // serve web app
  app.get('*', (req, res, next) => {
    renderApp(req, res, next)
  })

  // catch-all error handler
  app.use((err, req, res, next) => {
    if (!config.server.secure) {
      console.error(err.stack)
    }
    const errCode = err.code || 500
    const errType = err.type || 'Internal Server Error'
    const errMessage = err.message || err.toString()
    const errInfo = `<h1>${errCode} - ${errType}</h1><p>${errMessage}</p>`
    res.status(500).send(errInfo)
  })

  // socket cluster
  configureSocketCluster(httpServer)

  return httpServer.listen(config.server.port, error => {
    if (error) {
      console.error(error)
    } else {
      console.info(`🌍  Listening at ${config.server.baseURL} on port ${config.server.port}`)
    }
  })
}
