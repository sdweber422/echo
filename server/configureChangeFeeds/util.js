import raven from 'raven'

import config from 'src/config'

const sentry = new raven.Client(config.server.sentryDSN)

export function handleConnectionError(err) {
  console.error(err.stack)
  sentry.captureException(err)
}
