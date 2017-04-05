import fs from 'fs'
import path from 'path'
import yaml from 'yamljs'
import Promise from 'bluebird'

import {
  Question,
  Stat,
  SurveyBlueprint,
  getStatByDescriptor,
  getSurveyBlueprintByDescriptor,
} from 'src/server/services/dataService'

export default function reloadSurveyAndQuestionData() {
  const questions = _loadFromDataFile('questions')
  const surveyBlueprints = _loadFromDataFile('surveyBlueprints')
  const stats = _loadFromDataFile('stats')

  return Promise.all([
    Question.save(questions, {conflict: 'replace'}),

    Promise.map(surveyBlueprints, surveyBlueprint => (
      _mergeDataForDescriptor(SurveyBlueprint, surveyBlueprint, getSurveyBlueprintByDescriptor)
    )),

    Promise.map(stats, stat => (
      _mergeDataForDescriptor(Stat, stat, getStatByDescriptor)
    )),
  ])
}

function _loadFromDataFile(name) {
  const dataFilename = path.resolve(__dirname, '..', '..', 'db', 'data', `${name}.yaml`)
  const data = fs.readFileSync(dataFilename).toString()
  return yaml.parse(data)
}

async function _mergeDataForDescriptor(Model, data, getByDescriptor) {
  if (!data.id && data.descriptor) {
    try {
      const existingItem = await getByDescriptor(data.descriptor)
      if (existingItem) {
        return Model.get(existingItem.id).updateWithTimestamp(data)
      }
    } catch (err) {
      console.warn(err)
    }
  }

  return Model.save(data, {conflict: 'replace'})
}
