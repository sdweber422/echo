import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function getProjectSummary(identifier) {
  return {
    variables: {identifier},
    query: `query ($identifier: String!) {
      getProjectSummary(identifier: $identifier) {
        project {
          id
          name
          artifactURL
          createdAt
          updatedAt
          closedAt
          state
          goal {
            number
            title
            level
            url
          }
          stats {
            ${STAT_DESCRIPTORS.PROJECT_HOURS}
          }
          chapter {
            id
            name
          }
          cycle {
            id
            cycleNumber
            state
            startTimestamp
            endTimestamp
          }
        }
        projectUserSummaries {
          user {
            id
            name
            handle
            avatarUrl
          }
          userProjectEvaluations {
            ${STAT_DESCRIPTORS.GENERAL_FEEDBACK}
          }
          userRetrospectiveComplete
          userRetrospectiveUnlocked
        }
      }
    }`,
  }
}
