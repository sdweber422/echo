import yup from 'yup'

export const projectSchema = yup.object().shape({
  chapterIdentifier: yup.string().trim().required().min(3),
  cycleIdentifier: yup.number().integer().required().min(1),
  goalIdentifier: yup.number().integer().positive().required(),
  playerIdentifiers: yup.string().trim().required().test(
    'are-valid-user-identifiers',
    'Invalid user identifiers',
    isValidIdentifierString,
  ),
  coachIdentifier: yup.string().trim().required().test(
    'is-valid-user-identifier',
    'Invalid user identifier',
    isValidIdentifierString,
  ),
})

function isValidIdentifierString(value) {
  return (
    (value || '')
      .split(',')
      .map(v => v.trim())
      .filter(v => v)
  ).length > 0
}
