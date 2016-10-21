import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'

import {saveQuestions} from 'src/server/db/question'
import {saveSurveyBlueprints} from 'src/server/db/surveyBlueprint'
import {saveStats} from 'src/server/db/stat'

export default function reloadSurveyAndQuestionData() {
  return Promise.all([
    saveQuestions(loadFromDataFile('questions')),
    saveSurveyBlueprints(loadFromDataFile('surveyBlueprints')),
    saveStats(loadFromDataFile('stats')),
  ])
}

function loadFromDataFile(name) {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', `${name}.yaml`)
  const data = fs.readFileSync(dataFilename).toString()
  return yaml.parse(data)
}
