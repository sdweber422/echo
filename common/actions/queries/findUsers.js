import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  ELO,
  EXPERIENCE_POINTS,
  EXPERIENCE_POINTS_V2,
  LEVEL,
  LEVEL_V2,
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
            ${LEVEL_V2}
            ${EXPERIENCE_POINTS}
            ${EXPERIENCE_POINTS_V2}
            ${ELO}
          }
        }
      }
    `,
  }
}
