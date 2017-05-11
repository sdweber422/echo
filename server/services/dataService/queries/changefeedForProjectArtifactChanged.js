import r from '../r'

export default function changefeedForProjectArtifactChanged() {
  return r.table('projects').changes()
    .filter(row => {
      const origProject = row('old_val')
      const project = row('new_val')
      return r.or(
        r.and(
          r.not(origProject.hasFields('artifactURL')),
          project.hasFields('artifactURL')
        ),
        project('artifactURL').ne(origProject('artifactURL'))
      )
    })
}
