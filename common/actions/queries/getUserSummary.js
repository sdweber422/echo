import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  GENERAL_FEEDBACK,
  LEVEL,
  NUM_PROJECTS_REVIEWED,
  PROJECT_COMPLETENESS,
  PROJECT_HOURS,
  PROJECT_QUALITY,
  RELATIVE_CONTRIBUTION,
  TEAM_PLAY,
  TEAM_PLAY_FLEXIBLE_LEADERSHIP,
  TEAM_PLAY_FRICTION_REDUCTION,
  TEAM_PLAY_RECEPTIVENESS,
  TEAM_PLAY_RESULTS_FOCUS,
  TECHNICAL_HEALTH,
  TIME_ON_TASK,
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
          stats {
            ${LEVEL}
            ${EXPERIENCE_POINTS}
            ${ELO}
            ${CULTURE_CONTRIBUTION}
            ${TEAM_PLAY}
            ${TECHNICAL_HEALTH}
            ${TIME_ON_TASK}
            ${ESTIMATION_ACCURACY}
            ${ESTIMATION_BIAS}
            ${CHALLENGE}
            ${NUM_PROJECTS_REVIEWED}
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
              ${PROJECT_COMPLETENESS}
              ${PROJECT_HOURS}
              ${PROJECT_QUALITY}
            }
          }
          userProjectEvaluations {
            ${GENERAL_FEEDBACK}
          }
          userProjectStats {
            ${CHALLENGE}
            ${CULTURE_CONTRIBUTION}
            ${ESTIMATION_ACCURACY}
            ${ESTIMATION_BIAS}
            ${EXPERIENCE_POINTS}
            ${TEAM_PLAY_FLEXIBLE_LEADERSHIP}
            ${TEAM_PLAY_FRICTION_REDUCTION}
            ${PROJECT_HOURS}
            ${ELO}
            ${TEAM_PLAY_RECEPTIVENESS}
            ${RELATIVE_CONTRIBUTION}
            ${TEAM_PLAY_RESULTS_FOCUS}
            ${TEAM_PLAY}
            ${TECHNICAL_HEALTH}
            ${TIME_ON_TASK}
          }
        }
      }
    }`,
  }
}
