import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  ELO,
  EXPERIENCE_POINTS,
  LEVEL,
} = STAT_DESCRIPTORS

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
            ${LEVEL}
            ${EXPERIENCE_POINTS}
            ${ELO}
          }
        }
      }
    `,
  }
}
