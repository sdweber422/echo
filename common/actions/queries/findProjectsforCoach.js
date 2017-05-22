import {STAT_DESCRIPTORS} from 'src/common/models/stat'

export default function findProjectsForCoach(coachIdentifier) {
  return {
    variables: {coachIdentifier},
    query: `
    query($coachIdentifier: String!) {
      findProjectsForCoach(coachIdentifier: $coachIdentifier) {
        id
        name
        cycle {
          cycleNumber
        }
        state
        goal {
          title
        }
        players {
          handle
        }
        stats {
          ${STAT_DESCRIPTORS.PROJECT_COMPLETENESS}
        }
        coachCompletenessScore
      }
    }
    `
  }
}
