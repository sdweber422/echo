import yup from 'yup'

export const projectSchema = yup.object().shape({
  chapterIdentifier: yup.string().trim().required().min(3),
  coachIdentifier: yup.string().trim().test(
    'is-valid-user-identifier',
    'Invalid user identifier',
    _isValidIdentifier,
  ),
  cycleIdentifier: yup.number().integer().required().min(1),
  goalIdentifier: yup.number().integer().positive().required(),
  playerIdentifiers: yup.string().trim().required().test(
    'are-valid-user-identifiers',
    'Invalid user identifier(s)',
    _isValidIdentifierList,
  ),
})

function _isValidIdentifier(value) {
  if (!value) {
    return true
  }
  // https://github.com/shinnn/github-username-regex
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i
  return githubUsernameRegex.test(value)
}

function _isValidIdentifierList(value) {
  return (
    (value || '')
      .split(',')
      .map(v => v.trim())
      .filter(v => v)
  ).length > 0
}
