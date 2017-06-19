export default function findMyProjects(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query {
        findMyProjects {
          id
          name
          playerIds
          retrospectiveSurveyId
          createdAt
          updatedAt
          cycle {
            id
            cycleNumber
          }
          goal {
            title
          }
        }
      }
    `,
  }
}
