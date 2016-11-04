/* eslint-disable no-console, camelcase */
import raven from 'raven'
import config from 'src/config'
import {connect} from 'src/db'

const r = connect()
const sentry = new raven.Client(config.server.sentryDSN)

export default function projectArtifactChanged(projectArtifactChangedQueue) {
  r.table('projects').changes()
    .filter(r.row('new_val')('artifactURL').ne(r.row('old_val')('artifactURL')))
    .then(cursor => {
      cursor.each((err, {new_val: project}) => {
        if (err) {
          console.error(err)
          sentry.captureException(err)
          return
        }

        const jobOpts = {
          attempts: 3,
          backoff: {type: 'fixed', delay: 10000},
        }
        projectArtifactChangedQueue.add(project, jobOpts)
      })
    })
}
