import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  GENERAL_FEEDBACK,
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
          phase {
            id
            number
          }
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
            state
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
          }
          userProjectEvaluations {
            ${GENERAL_FEEDBACK}
          }
        }
      }
    }`,
  }
}
