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
        coachCompletenessScore
      }
    }
    `
  }
}
