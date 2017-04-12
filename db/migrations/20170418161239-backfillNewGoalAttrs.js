export async function up(r) {
  const isDynamicGoalNumber = number => r.expr([
    143, // LOS Apprentice
    238, // Work On Step
    258, // Work On Interview App
    295, // Work on Literator
  ]).contains(number)

  const mergeDynamic = _ => _.merge({
    dynamic: r.and(
      _.hasFields('number'),
      isDynamicGoalNumber(_('number'))
    )
  })
  const mergeXpValue = _ => _.merge({
    xpValue: _('level').default(1).coerceTo('number')
      .mul(_('teamSize'))
      .mul(50)
  })

  const backfillVotesResult = await r.table('votes')
    .replace(vote =>
      r.branch(
        vote.hasFields('goals'),
        vote.merge({
          goals: vote('goals')
            .map(mergeDynamic)
            .map(mergeXpValue)
        }),
        vote
      )
    )
  if (backfillVotesResult.errors) {
    throw new Error(`could not backfill votes: ${backfillVotesResult.first_error}`)
  }

  const backfillProjectsResult = await r.table('projects')
    .replace(project =>
      r.branch(
        project.hasFields('goal'),
        project.merge({
          goal: project('goal')
            .do(mergeDynamic)
            .do(mergeXpValue)
        }),
        project
      )
    )
  if (backfillProjectsResult.errors) {
    throw new Error(`could not backfill projects: ${backfillProjectsResult.first_error}`)
  }
}

export async function down(r) {
  await r.table('projects')
    .filter(_ => _.hasFields('goal'))
    .update({goal: {
      dynamic: r.literal(),
      xpValue: r.literal(),
    }})

  await r.table('votes')
    .filter(_ => _.hasFields('goals'))
    .replace(_ => _.merge({
      goals: _('goals').without('dynamic', 'xpValue')
    }))
}
