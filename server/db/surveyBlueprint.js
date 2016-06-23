import r from '../../db/connect'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../common/models/surveyBlueprint'
import {insertIntoTable, updateInTable} from '../../server/db/util'
import {customQueryError} from './errors'

export const surveysBluprintsTable = r.table('surveyBlueprints')

export function saveSurveyBlueprint(surveyBlueprint) {
  if (surveyBlueprint.id) {
    return update(surveyBlueprint)
  }

  if (surveyBlueprint.descriptor) {
    return getSurveyBlueprintByDescriptor(surveyBlueprint.descriptor)
      .then(existingSurveyBlueprint =>
        update(
          Object.assign({}, {id: existingSurveyBlueprint.id}, surveyBlueprint)
        )
      )
      .catch(() => insert(surveyBlueprint))
  }

  return insert(surveyBlueprint)
}

export function getSurveyBlueprintById(id) {
  return surveysBluprintsTable.get(id)
}

export function getSurveyBlueprintByDescriptor(descriptor) {
  return surveysBluprintsTable.getAll(descriptor, {index: 'descriptor'})
    .nth(0)
    .default(customQueryError(`No Survey Blueprint found with descriptor ${descriptor}`))
}

export function getRetrospectiveSurveyBlueprint() {
  return getSurveyBlueprintByDescriptor(SURVEY_BLUEPRINT_DESCRIPTORS.retrospective)
}

function update(surveyBlueprint, options) {
  return updateInTable(surveyBlueprint, surveysBluprintsTable, options)
}

function insert(surveyBlueprint, options) {
  return insertIntoTable(surveyBlueprint, surveysBluprintsTable, options)
}
