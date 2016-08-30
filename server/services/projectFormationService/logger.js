/* eslint-disable no-nested-ternary, no-multi-spaces, comma-spacing */
/* eslint key-spacing: ["error", { "mode": "minimum" }] */

const [NONE, ERROR, LOG, DEBUG, TRACE] = [1, 2, 3, 4, 5]
const LOG_LEVEL = process.env.NODE_ENV === 'development' ? DEBUG :
                  process.env.NODE_ENV === 'test'        ? NONE  :
                  LOG

export default {
  error: (...args) => should(ERROR) && console.log('[projectFormationService] ERROR>', ...args),
  log:   (...args) => should(LOG)   && console.log('[projectFormationService] LOG>'  , ...args),
  debug: (...args) => should(DEBUG) && console.log('[projectFormationService] DEBUG>', ...args),
  trace: (...args) => should(TRACE) && console.log('[projectFormationService] TRACE>', ...args),
}

function should(lvl) {
  return LOG_LEVEL >= lvl
}
