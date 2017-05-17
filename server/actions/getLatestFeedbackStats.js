import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {findLatestFeedbackResponses} from 'src/server/services/dataService'
import {likert7Average, LIKERT_SCORE_NA} from 'src/server/util/stats'

export default async function getLatestFeedbackStats({respondentId, subjectId}) {
  const latestResponses = await findLatestFeedbackResponses({respondentId, subjectId})
  if (latestResponses.length === 0) {
    return
  }

  return [
    STAT_DESCRIPTORS.TEAM_PLAY,
    STAT_DESCRIPTORS.CULTURE_CONTRIBUTION,
    STAT_DESCRIPTORS.TECHNICAL_HEALTH,
  ].reduce((result, stat) => {
    const response = latestResponses.find(response => response.statDescriptor === stat)
    if (response && response.value !== LIKERT_SCORE_NA) {
      result[stat] = likert7Average([response.value])
    }
    return result
  }, {})
}
