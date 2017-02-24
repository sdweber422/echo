/* eslint-disable no-multi-spaces */
import Promise from 'bluebird'
import {PRACTICE, REFLECTION} from 'src/common/models/cycle'
import {PROJECT_STATES} from 'src/common/models/project'

export async function up(r) {
  const cycles = await r.table('cycles')

  await Promise.map(cycles, cycle => {
    const state =
      cycle.state === PRACTICE   ? PROJECT_STATES.IN_PROGRESS :
      cycle.state === REFLECTION ? PROJECT_STATES.REVIEW      : PROJECT_STATES.CLOSED

    const reviewStartedAt = state === PROJECT_STATES.REVIEW ?
      r.now() :
      r.row('updatedAt')

    console.log(`update cycle ${cycle.id} (${cycle.cycleNumber}) in state ${cycle.state} with state ${state}`)

    return r.table('projects')
      .filter({cycleId: cycle.id})
      .update({state, reviewStartedAt}, {returnChanges: true})
  })
}

export async function down(r) {
  await r.table('projects').replace(r.row.without('state', 'reviewStartedAt'))
}
