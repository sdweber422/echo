import dbConfig from 'src/config/db'
import {createDb} from 'src/server/services/dataService'
import {finish} from './util'

createDb(dbConfig.db)
  .then(() => finish())
  .catch(finish)
