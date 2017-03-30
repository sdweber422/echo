import yup from 'yup'

export const projectSchema = yup.object().shape({
  chapterIdentifier: yup.string().trim().required().min(3),
  coachIdentifier: yup.string().trim().required().test(
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
  return /^[a-z0-9]+$/i.test(value)
}

function _isValidIdentifierList(value) {
  return (
    (value || '')
      .split(',')
      .map(v => v.trim())
      .filter(v => v)
  ).length > 0
}
