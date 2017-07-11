export default function findPhasesWithProjects() {
  return {
    variables: {},
    query: `
      query {
        findPhases {
          id
          number
          currentProjects {
            id
            name
            memberIds
            phaseId
            artifactURL
            retrospectiveSurveyId
            createdAt
            updatedAt
            cycle {
              id
              cycleNumber
              state
            }
            goal {
              title
            }
          }
        }
      }
    `,
  }
}
