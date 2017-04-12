const DEFAULT_TEAM_SIZE = 2

/* eslint-disable camelcase */
export function goalFromMetadata(goalMetadata) {
  const {url} = goalMetadata
  if (url.match(/github\.com\//)) {
    return goalFromGithubIssue(goalMetadata)
  }

  return goalFromGoalLibraryMetadata(goalMetadata)
}

export function goalFromGithubIssue(githubIssue) {
  if (
    !githubIssue.number ||
    !githubIssue.html_url ||
    !githubIssue.url ||
    !githubIssue.title ||
    !githubIssue.labels
  ) {
    throw new Error('Unparseable GitHub issue.')
  }

  const teamSize = githubIssue.labels.reduce((result, label) => {
    if (result) {
      return result
    }
    const matches = label.name.match(/^team-size-(\d+)$/)
    return matches && matches[1] ? parseInt(matches[1], 10) : result
  }, null) || DEFAULT_TEAM_SIZE
  const levelString = (githubIssue.milestone || {}).title
  const level = levelString ? parseInt(levelString.replace('Level ', ''), 10) : null

  const baseXp = level * teamSize * 50
  const bonusMultiplier = teamSize === 1 ? 0.075 : 0.15
  const bonusXp = baseXp * bonusMultiplier

  return {
    number: githubIssue.number,
    url: githubIssue.html_url,
    title: githubIssue.title,
    teamSize,
    level,
    baseXp,
    bonusXp,
    dynamic: false,
    githubIssue,
  }
}

export function goalFromGoalLibraryMetadata(goalMetadata) {
  if (
    !goalMetadata.url ||
    !goalMetadata.goal_id ||
    !goalMetadata.title ||
    !goalMetadata.team_size ||
    !goalMetadata.base_xp ||
    !goalMetadata.bonus_xp ||
    typeof goalMetadata.dynamic === 'undefined'
  ) {
    throw new Error('Unparseable goal metadata.')
  }

  return {
    number: goalMetadata.goal_id,
    url: goalMetadata.url,
    title: goalMetadata.title,
    teamSize: goalMetadata.team_size,
    level: goalMetadata.level,
    baseXp: goalMetadata.base_xp,
    bonusXp: goalMetadata.bonus_xp,
    dynamic: goalMetadata.dynamic,
    goalMetadata,
  }
}

export function renderGoalAsString(goal) {
  const goalLevel = goal.level ? ` [L${goal.level}]` : ''
  return `#${goal.number}${goalLevel}: ${goal.title}`
}
