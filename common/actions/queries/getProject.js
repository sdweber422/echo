export default function getProject(identifier) {
  return {
    variables: {identifier},
    query: `
      query ($identifier: String!) {
        getProject(identifier: $identifier) {
          id
          name
          retrospectiveSurveyId
          chapterId
          chapter {
            id
            name
          }
          cycleId
          cycle {
            id
            cycleNumber
          }
          phaseId
          phase {
            id
            number
          }
          goal {
            url
            number
          }
          players {
            id
            handle
          }
          createdAt
          updatedAt
        }
      }
    `,
  }
}
