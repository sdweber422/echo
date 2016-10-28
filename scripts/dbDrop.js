/* eslint-disable xo/no-process-exit */
import {drop} from 'src/db'

drop()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
