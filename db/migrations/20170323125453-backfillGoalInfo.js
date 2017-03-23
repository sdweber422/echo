export async function up(r) {
  const execIfGitHubIssue = (goal, func) => (
    r.branch(
      goal.hasFields('githubIssue'),
      func(goal),
      goal
    )
  )

  const mergeGHINumber = goal => goal.merge({
    number: goal('githubIssue')('number'),
  })
  const mergeGHILevel = goal => goal.merge({
    level: goal('githubIssue')('milestone')
      .default({})('title')
      .default(null)
      .do(levelStr =>
        r.branch(
          levelStr.ne(null),
          levelStr.split('Level ').nth(1).default(null).coerceTo('number').floor().default(null),
          null
        )
      )
  })
  const DEFAULT_TEAM_SIZE = 2
  const mergeGHITeamSize = goal => goal.merge({
    teamSize: goal('githubIssue')('labels')
      .filter(label => label('name').match('team-size-'))
      .nth(0).default(null)('name').default(null)
      .do(teamSizeStr => r.branch(
        teamSizeStr.ne(null),
        teamSizeStr.split('team-size-').nth(1).default(null).coerceTo('number').default(DEFAULT_TEAM_SIZE),
        DEFAULT_TEAM_SIZE
      ))
  })

  const mergeNumber = goal => execIfGitHubIssue(goal, mergeGHINumber)
  const mergeLevel = goal => execIfGitHubIssue(goal, mergeGHILevel)
  const mergeTeamSize = goal => execIfGitHubIssue(goal, mergeGHITeamSize)

  const backfillVotesResult = await r.table('votes')
    .replace(vote =>
      r.branch(
        vote.hasFields('goals'),
        vote.merge({
          goals: vote('goals')
            .map(mergeNumber)
            .map(mergeLevel)
            .map(mergeTeamSize)
        }),
        vote
      )
    )
  if (backfillVotesResult.errors) {
    throw new Error(`could not backfill votes: ${backfillVotesResult.first_error}`)
  }

  const backfillProjects = await r.table('projects')
    .replace(project =>
      r.branch(
        project.hasFields('goal'),
        project.merge({
          goal: project('goal')
            .do(mergeNumber)
            .do(mergeLevel)
            .do(mergeTeamSize)
        }),
        project
      )
    )
  if (backfillProjects.errors) {
    throw new Error(`could not backfill projects: ${backfillProjects.first_error}`)
  }
}

export function down() {
  console.info('We only added or corrected data. No down migration necessary / possible.')
}
