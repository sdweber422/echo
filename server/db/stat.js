import r from 'src/db/connect'
import {insertIntoTable, updateInTable, replaceInTable} from 'src/server/db/util'

import {customQueryError} from './errors'

export const statsTable = r.table('stats')

export function saveStat(stat) {
  if (stat.id) {
    return replace(stat)
  }

  if (stat.descriptor) {
    return getStatByDescriptor(stat.descriptor)
      .then(existingStat =>
        update(
          Object.assign({}, {id: existingStat.id}, stat)
        )
      )
      .catch(() => insert(stat))
  }

  return insert(stat)
}

export function getStatByDescriptor(descriptor) {
  return statsTable.getAll(descriptor, {index: 'descriptor'})
    .nth(0)
    .default(customQueryError(`No Stat found with descriptor ${descriptor}`))
}

export function saveStats(stats) {
  return Promise.all(stats.map(
    stat => saveStat(stat)
  ))
}

export function getStatById(id) {
  return statsTable.get(id)
}

function update(stat, options) {
  return updateInTable(stat, statsTable, options)
}

function replace(stat, options) {
  return replaceInTable(stat, statsTable, options)
}

function insert(stat, options) {
  return insertIntoTable(stat, statsTable, options)
}

