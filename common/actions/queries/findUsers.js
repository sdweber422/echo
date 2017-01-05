import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function findUsers(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query ($identifiers: [String]) {
        findUsers(identifiers: $identifiers) {
          id
          chapterId
          phone
          email
          name
          handle
          avatarUrl
          profileUrl
          timezone
          active
          createdAt
          updatedAt
          stats {
            ${STAT_DESCRIPTORS.EXPERIENCE_POINTS}
            ${STAT_DESCRIPTORS.RATING_ELO}
          }
        }
      }
    `,
  }
}
