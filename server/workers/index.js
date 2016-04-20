import raven from 'raven'

if (process.env.NODE_ENV === 'development') {
  require('dotenv').load()
}

require('./newPlayer').start()
