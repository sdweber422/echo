import {create} from 'src/db'
import {finish} from './util'

create()
  .then(() => finish())
  .catch(finish)
