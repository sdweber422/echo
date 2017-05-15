import dbConfig from 'src/config/db'
import {dropDb} from 'src/server/services/dataService'
import {finish} from './util'

dropDb(dbConfig.db)
  .then(() => finish())
  .catch(finish)
