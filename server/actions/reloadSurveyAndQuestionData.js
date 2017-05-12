import {Question, Stat, SurveyBlueprint} from 'src/server/services/dataService'

export default function reloadSurveyAndQuestionData() {
  return Promise.all([
    Question.reload(),
    SurveyBlueprint.reload(),
    Stat.reload(),
  ])
}
