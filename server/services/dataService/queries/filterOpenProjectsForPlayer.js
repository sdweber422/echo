import r from '../r'

export default function filterOpenProjectsForPlayer(playerId) {
  return function (project) {
    const containsPlayer = project => project('playerIds').contains(playerId)
    const hasRetroSurvey = project => project('retrospectiveSurveyId')
    const isRetroOpenForPlayer = project =>
      r.table('surveys')
        .get(project('retrospectiveSurveyId'))
        .do(survey =>
          r.or(
            survey('unlockedFor').default([]).contains(playerId),
            survey('completedBy').default([]).contains(playerId).not()
          )
        )
    return r.and(
      containsPlayer(project),
      hasRetroSurvey(project),
      isRetroOpenForPlayer(project)
    )
  }
}
