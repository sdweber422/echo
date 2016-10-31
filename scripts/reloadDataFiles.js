/* eslint-disable xo/no-process-exit */
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'
import {finish} from './util'

console.log('Reloading Data Files')

reloadSurveyAndQuestionData()
  .then(() => finish())
  .catch(finish)
