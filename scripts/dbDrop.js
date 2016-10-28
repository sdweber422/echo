/* eslint-disable xo/no-process-exit */
import {drop} from 'src/db'
import {finish} from './util'

drop()
  .then(() => finish())
  .catch(finish)
