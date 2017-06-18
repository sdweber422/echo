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
            state
            artifactURL
            createdAt
            updatedAt
            goal {
              number
              title
              level
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
      }
    `,
  }
}
