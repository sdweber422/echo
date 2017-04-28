/* eslint-disable no-console, camelcase */
import {PROJECT_STATES, IN_PROGRESS} from 'src/common/models/project'
import {processStateChange} from './util'

export default function projectStateChanged(projectStateChangedQueues) {
  return processStateChange('projects', 'project', PROJECT_STATES, IN_PROGRESS, projectStateChangedQueues)
}
