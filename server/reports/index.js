import auth from 'basic-auth'
import express from 'express'

/* eslint babel/new-cap: [2, {"capIsNewExceptions": ["Router"]}] */
const app = new express.Router()

app.use(/^\/reports\/.*/, (req, res, next) => {
  if (!userIsAuthorized(req)) {
    res.statusCode = 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Learners Guild Reports"')
    res.end('Access denied')
  } else {
    next()
  }
})

app.get('/reports/:reportName', requestHandler)

export default app

const VALID_REPORTS = [
  'cycleResponses'
]

function requestHandler(req, res, next) {
  const {reportName} = req.params

  assertReportNameIsValid(reportName)

  res.set('Content-Type', 'text/csv')
  return require(`./${reportName}`)(req, res).catch(next)
}

function userIsAuthorized(req) {
  const credentials = auth(req)

  return (
    credentials &&
    credentials.name === process.env.REPORTING_USERNAME &&
    credentials.pass === process.env.REPORTING_SECRET
  )
}

function assertReportNameIsValid(name) {
  if (!VALID_REPORTS.includes(name)) {
    throw new Error(`Invalid report name: "${name}". Valid reports are ${VALID_REPORTS.join(', ')}`)
  }
}
