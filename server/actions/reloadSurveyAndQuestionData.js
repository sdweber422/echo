import {Question, Stat, SurveyBlueprint, Phase} from 'src/server/services/dataService'

export default function reloadSurveyAndQuestionData() {
  return Promise.all([
    Question.syncData(),
    SurveyBlueprint.syncData(),
    Stat.syncData(),
    Phase.syncData(),
  ])
}
