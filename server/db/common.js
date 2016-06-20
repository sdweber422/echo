export function updateAll(records, getById) {
  const promises = records.map(record =>
    getById(record.id).update(record)
      .then(result => checkForErrors(result))
  )
  return Promise.all(promises)
}

export function insert(records, table) {
  return table.insert(records)
    .then(result => checkForErrors(result))
}

function checkForErrors(result) {
  if (result.errors > 0) {
    throw new Error(result.first_error)
  }
  return result
}

