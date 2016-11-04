import raven from 'raven'
import {ReqlDriverError, ReqlServerError} from 'rethinkdbdash/lib/error'

import config from 'src/config'

const sentry = new raven.Client(config.server.sentryDSN)
const MAX_ATTEMPTS = 10

export function processChangeFeedWithAutoReconnect(getFeed, onFeedItem, changeFeedName, attempts = 0, err = null) {
  if (attempts >= MAX_ATTEMPTS) {
    console.error(`${changeFeedName}: Attempted ${attempts} times to obtain connection to changefeed without success. Giving up.`, err.stack)
    sentry.captureException(err)
    throw err
  } else if (attempts > 0) {
    console.warn(`${changeFeedName}: Attempted ${attempts} times to obtain connection to changefeed, but haven't yet succeeded; trying again.`)
  }
  setTimeout(() => {
    processChangeFeed(getFeed, onFeedItem, changeFeedName, attempts)
  }, attempts * 10000) // linear back-off (0s, 10s, 20s, 30s, 40s ...)
}

async function processChangeFeed(getFeed, onFeedItem, changeFeedName, attempts) {
  try {
    const cursor = await getFeed()
    console.info(`${changeFeedName}: Successfully obtained connection to changefeed.`)
    cursor.each((err, result) => {
      if (err) {
        if (_isConnectionError(err)) {
          // if we get here, we've connected successfully _at least_ once, so we
          // reset our number of `attempts` to 0
          return processChangeFeedWithAutoReconnect(getFeed, onFeedItem, changeFeedName, 0, err)
        }
        console.error(err)
        sentry.captureException(err)
        throw err
      }
      onFeedItem(result)
    })
  } catch (err) {
    if (_isConnectionError(err)) {
      return processChangeFeedWithAutoReconnect(getFeed, onFeedItem, changeFeedName, attempts + 1, err)
    }
    console.error(err)
    sentry.captureException(err)
    throw err
  }
}

function _isConnectionError(err) {
  return (err instanceof ReqlServerError) || (err instanceof ReqlDriverError)
}
