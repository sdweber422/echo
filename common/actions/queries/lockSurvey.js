import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function lockSurvey(playerId, projectId) {
  return {
    variables: {playerId, projectId},
    query: `
      mutation($playerId: ID!, $projectId: ID!) {
        lockRetroSurveyForUser(playerId: $playerId, projectId: $projectId) {
          project {
            id
            name
            artifactURL
            createdAt
            updatedAt
            goal {
              number
              title
              level
            }
            stats {
              ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
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
          projectEvaluations {
            createdAt
            submittedBy {
              id
              handle
              name
            }
            ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
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
      }
    `,
  }
}
