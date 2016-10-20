export const STATS_QUESTION_TYPES = {
  RELATIVE_CONTRIBUTION: 'relativeContribution',
  LEARNING_SUPPORT: 'technicalHealth',
  TEAM_PLAY: 'teamPlay',
  CULTURE_CONTRIBUTION: 'cultureContribution',
  PROJECT_HOURS: 'projectHours',
  GENERAL_FEEDBACK: 'generalFeedback',
}

export function groupResponsesBySubject(surveyResponses) {
  return surveyResponses.reduce((result, response) => {
    const {subjectId} = response

    if (!result.has(subjectId)) {
      result.set(subjectId, [])
    }
    result.get(subjectId).push(response)

    return result
  }, new Map())
}
