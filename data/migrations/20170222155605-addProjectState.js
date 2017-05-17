/* eslint-disable no-multi-spaces */
import Promise from 'bluebird'
import {PRACTICE, REFLECTION} from 'src/common/models/cycle'
import {IN_PROGRESS, REVIEW, CLOSED} from 'src/common/models/project'

export async function up(r) {
  const cycles = await r.table('cycles')

  await Promise.map(cycles, cycle => {
    const state =
      cycle.state === PRACTICE   ? IN_PROGRESS :
      cycle.state === REFLECTION ? REVIEW      :
                                   CLOSED

    const reviewStartedAt = state === REVIEW ?
      r.now() :
      r.row('updatedAt')

    return r.table('projects')
      .filter({cycleId: cycle.id})
      .update({state, reviewStartedAt}, {returnChanges: true})
  })
}

export async function down(r) {
  await r.table('projects').replace(r.row.without('state', 'reviewStartedAt'))
}
