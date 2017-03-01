import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {
  CHALLENGE,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  GENERAL_FEEDBACK,
  LEVEL,
  EXTERNAL_PROJECT_REVIEW_COUNT,
  PROJECT_COMPLETENESS,
  PROJECT_HOURS,
  PROJECT_QUALITY,
  PROJECT_REVIEW_ACCURACY,
  RELATIVE_CONTRIBUTION,
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
            ${CHALLENGE}
            ${ELO}
            ${ESTIMATION_ACCURACY}
            ${ESTIMATION_BIAS}
            ${EXPERIENCE_POINTS}
            ${LEVEL}
            ${EXTERNAL_PROJECT_REVIEW_COUNT}
            ${PROJECT_REVIEW_ACCURACY}
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
            ${ELO}
            ${ESTIMATION_ACCURACY}
            ${ESTIMATION_BIAS}
            ${EXPERIENCE_POINTS}
            ${LEVEL} {
              starting
              ending
            }
            ${PROJECT_HOURS}
            ${RELATIVE_CONTRIBUTION}
          }
        }
      }
    }`,
  }
}
