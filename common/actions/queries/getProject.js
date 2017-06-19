export default function getProject(identifier) {
  return {
    variables: {identifier},
    query: `
      query ($identifier: String!) {
        getProject(identifier: $identifier) {
          id
          chapterId
          name
          retrospectiveSurveyId
          createdAt
          updatedAt
          chapter {
            id
            name
          }
          cycleId
          cycle {
            id
            cycleNumber
          }
          goal {
            url
            number
          }
          players {
            id
            handle
          }
        }
      }
    `,
  }
}
