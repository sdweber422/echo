import fs from 'fs'
import path from 'path'
import r from '../db/connect'
import {updateInTable, insertIntoTable} from '../server/db/util'
import {finish} from './util'

const LOG_PREFIX = '[importSurveyResponses]'
const DATA_FILE_PATH = path.resolve(__dirname, '../tmp/responses-create.json')

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []
  const items = await loadResponseData()

  console.log(LOG_PREFIX, `Importing ${items.length} survey responses`)

  const imports = items.map(item => {
    return importResponse(item).catch(err => {
      errors.push(err)
    })
  })

  await Promise.all(imports)

  if (errors.length) {
    console.error(LOG_PREFIX, 'Errors:')
    errors.forEach(err => console.log('\n', err.message))
    throw new Error('Some imports failed')
  }
}

function loadResponseData() {
  return new Promise((resolve, reject) => {
    fs.readFile(DATA_FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        return reject(err)
      }

      try {
        const items = JSON.parse(data)

        if (!Array.isArray(items)) {
          return reject(new Error('File parse error: data must be a JSON array'))
        }

        resolve(items.map(validateResponseItem))
      } catch (validationErr) {
        reject(validationErr)
      }
    })
  })
}

function validateResponseItem(data) {
  const {surveyId, questionId, respondentId, subjectId, value} = data || {}

  if (typeof surveyId !== 'string' || !surveyId.length) {
    throw new Error(`Invalid surveyId: ${surveyId}`)
  }
  if (typeof questionId !== 'string' || !questionId.length) {
    throw new Error(`Invalid questionId: ${questionId}`)
  }
  if (typeof respondentId !== 'string' || !respondentId.length) {
    throw new Error(`Invalid respondentId: ${respondentId}`)
  }
  if (typeof subjectId !== 'string' || !subjectId.length) {
    throw new Error(`Invalid respondentId: ${subjectId}`)
  }
  if (typeof value === 'undefined') {
    throw new Error(`Invalid value: ${value}`)
  }

  return data
}

async function importResponse(data) {
  const responses = await findResponses(data)

  if (responses.length > 1) {
    throw new Error(`Too many matching responses found for item: ${JSON.stringify(data)}`)
  }

  const result = responses.length === 1 ?
    await updateResponse({id: responses[0].id, value: data.value}) :
    await createResponse(data)

  console.log('result:', result)
}

function findResponses(filters) {
  const {surveyId, questionId, respondentId, subjectId} = filters || {}

  return r.table('responses')
          .filter({surveyId, questionId, respondentId, subjectId})
}

function updateResponse(values) {
  console.log(LOG_PREFIX, `Updating value for survey response ${values.id}`)
  return updateInTable(values, r.table('responses'))
}

function createResponse(values) {
  console.log(LOG_PREFIX, 'Creating new survey response', values)
  return insertIntoTable(values, r.table('responses'))
}
