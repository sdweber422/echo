const [ERROR, LOG, DEBUG, TRACE] = [4, 3, 2, 1]
const LOG_LEVEL = LOG

export default {
  error: (...args) => should(ERROR) && console.log('[projectFormationService] ERROR>', ...args),
  log: (...args) => should(LOG) && console.log('[projectFormationService] LOG>', ...args),
  debug: (...args) => should(DEBUG) && console.log('[projectFormationService] DEBUG>', ...args),
  trace: (...args) => should(TRACE) && console.log('[projectFormationService] TRACE>', ...args),
}

function should(lvl) {
  return LOG_LEVEL >= lvl
}

