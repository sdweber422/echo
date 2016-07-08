/* eslint-disable no-console, camelcase */
import raven from 'raven'
import r from '../../db/connect'

const sentry = new raven.Client(process.env.SENTRY_SERVER_DSN)

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

        projectArtifactChangedQueue.add(project)
      })
    })
}
