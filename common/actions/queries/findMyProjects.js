import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function findMyProjects(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query {
        findMyProjects {
          id
          name
          playerIds
          createdAt
          cycle {
            id
            cycleNumber
          }
          goal {
            title
          }
          stats {
            ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
          }
          state
        }
      }
    `,
  }
}
