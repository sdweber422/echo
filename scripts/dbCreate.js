/* eslint-disable xo/no-process-exit */
import {create} from 'src/db'

create()
  .then(() => {
    process.exit(0)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
