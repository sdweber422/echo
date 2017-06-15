import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function findProjects({page, identifiers} = {}) {
  return {
    variables: {page, identifiers},
    query: `
      query ($identifiers: [String], $page: ProjectPageInput) {
        findProjects(identifiers: $identifiers, page: $page) {
          id
          name
          state
          playerIds
          createdAt
          coachId
          cycle {
            id
            cycleNumber
            state
          }
          goal {
            title
          }
          stats {
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
          }
        }
      }
    `,
  }
}
