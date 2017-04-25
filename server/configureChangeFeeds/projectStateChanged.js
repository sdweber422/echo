/* eslint-disable no-console, camelcase */
import processChangeFeedWithAutoReconnect from 'rethinkdb-changefeed-reconnect'

import {connect} from 'src/db'
import {PROJECT_STATES, IN_PROGRESS} from 'src/common/models/project'
import {handleConnectionError} from './util'

const r = connect()

export default function projectStateChanged(projectStateChangedQueues) {
  processChangeFeedWithAutoReconnect(_getFeed, _getFeedProcessor(projectStateChangedQueues), handleConnectionError, {
    changefeedName: 'project state changed',
  })
}

function _getFeed() {
  return r.table('projects').changes()
    .filter(
      r.row('old_val').eq(null)  // new projects
      .or(r.row('new_val')('state').ne(r.row('old_val')('state')))  // project state changes
    )
}

function _getFeedProcessor(projectStateChangedQueues) {
  return ({new_val: project, old_val: projectBeforeChange}) => {
    // if there was no previous project, that means this is a new project
    const previousState = projectBeforeChange ? projectBeforeChange.state : '(not yet created)'
    console.log(`Project state for ${project.name} changed from ${previousState} to ${project.state}`)
    const queue = projectStateChangedQueues[project.state]

    if (queue) {
      // setting the previous state index to -1 in the case that this is a new project ensures that
      // stateChangeIsInOrder will evaluate to true below
      const previousStateIndex = projectBeforeChange ? PROJECT_STATES.indexOf(projectBeforeChange.state) : -1
      const newStateIndex = PROJECT_STATES.indexOf(project.state)
      const stateChangeIsInOrder = previousStateIndex === newStateIndex - 1

      if (stateChangeIsInOrder) {
        let jobOpts
        if (project.state === IN_PROGRESS) {
          jobOpts = {timeout: 60 * 60000}
        } else {
          jobOpts = {
            attempts: 3,
            backoff: {type: 'fixed', delay: 10000},
          }
        }
        queue.add(project, jobOpts)
      } else {
        console.log('Ignoring out of order state change; not adding job to queue')
      }
    }
  }
}
