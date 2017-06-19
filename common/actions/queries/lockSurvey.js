import {FEEDBACK_TYPE_DESCRIPTORS} from 'src/common/models/feedbackType'

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
            retrospectiveSurveyId
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
              ${FEEDBACK_TYPE_DESCRIPTORS.GENERAL_FEEDBACK}
            }
            userRetrospectiveComplete
            userRetrospectiveUnlocked
          }
        }
      }
    `,
  }
}
