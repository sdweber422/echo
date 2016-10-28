import {connect} from 'src/db'

export const thinky = require('thinky')({
  r: connect(),
  createDatabase: false,
})

export const models = require('./models')(thinky)
