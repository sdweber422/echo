import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  GENERAL_FEEDBACK,
  PROJECT_HOURS,
} = STAT_DESCRIPTORS

export default function getUserSummary(identifier) {
  return {
    variables: {identifier},
    query: `query ($identifier: String!) {
      getUserSummary(identifier: $identifier) {
        user {
          id
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
          chapter {
            id
            name
          }
        }
        userProjectSummaries {
          project {
            id
            name
            cycle {
              state
              cycleNumber
              startTimestamp
              endTimestamp
            }
            goal {
              title
              number
              level
            }
            stats {
              ${PROJECT_HOURS}
            }
            state
          }
          userProjectEvaluations {
            ${GENERAL_FEEDBACK}
          }
        }
      }
    }`,
  }
}
