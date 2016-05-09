import {combineReducers} from 'redux'

import {routerReducer} from 'react-router-redux'
import {reducer as formReducer} from 'redux-form'

import {auth} from './auth'
import {chapters} from './chapters'
import {cycles} from './cycles'
import {players} from './players'
import {errors} from './errors'

const rootReducer = combineReducers({
  routing: routerReducer,
  form: formReducer,
  auth,
  chapters,
  cycles,
  players,
  errors,
})

export default rootReducer
