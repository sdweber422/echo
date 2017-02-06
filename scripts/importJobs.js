/* eslint-disable import/imports-first */
import parseArgs from 'minimist'
import Promise from 'bluebird'

const {createJob} = require('src/server/services/jobService')
const {loadJSON} = require('src/server/util')
const {finish} = require('./util')

const JOB_OPTIONS = {attempts: 3, backoff: {type: 'fixed', delay: 60000}}

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const {INPUT_FILE} = _parseCLIArgs(process.argv.slice(2))
  const errors = []
  const items = await loadJSON(INPUT_FILE, validateJob)

  console.log(`Importing ${items.length} job(s)`)

  await Promise.each(items, async ({queue, payload}) => {
    console.log(`adding job to queue: ${queue}`)
    try {
      await createJob(queue, payload, JOB_OPTIONS)
    } catch (err) {
      errors.push(err)
    }
  })

  if (errors.length > 0) {
    console.error('Errors:\n')
    errors.forEach(err => console.log(err, '\n'))
    throw new Error('Some imports failed')
  }
}

function validateJob(data) {
  const {queue} = data || {}
  if (typeof queue !== 'string' || queue.length === 0) {
    throw new Error('Must specify a valid queue name')
  }
  return data
}

function _parseCLIArgs(argv) {
  const args = parseArgs(argv)
  const [INPUT_FILE] = args._
  if (!INPUT_FILE) {
    console.warn('Usage:')
    console.warn('  npm run import:jobs -- INPUT_FILE')
    throw new Error('Invalid Arguments')
  }
  return {INPUT_FILE}
}
