import r from '../../db/connect'

export function updateInTable(record, table, options = {}) {
  const recordWithTimestamps = mergeUpdateTimestamp(record)
  return table
      .get(recordWithTimestamps.id)
      .update(recordWithTimestamps, options)
      .then(result => checkForErrors(result))
}

export function updateAllInTable(records, table, options = {}) {
  return Promise.all(
    records.map(record => updateInTable(record, table, options))
  )
}

export function insertIntoTable(record, table, options = {}) {
  return insertAllIntoTable([record], table, options)
}

export function insertAllIntoTable(records, table, options = {}) {
  const recordsWithTimestamps = records.map(record => mergeCreationTimestamps(record))
  return table.insert(recordsWithTimestamps, options)
    .then(result => checkForErrors(result))
}

function mergeUpdateTimestamp(record) {
  return Object.assign({}, {
    updatedAt: r.now(),
  }, record)
}

function mergeCreationTimestamps(record) {
  return Object.assign({}, {
    createdAt: r.now(),
  }, mergeUpdateTimestamp(record))
}

function checkForErrors(result) {
  if (result.errors > 0) {
    throw new Error(result.first_error)
  }
  return result
}

