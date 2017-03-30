export default function getProject(identifier) {
  return {
    variables: {identifier},
    query: `
      query ($identifier: String!) {
        getProject(identifier: $identifier) {
          id
          name
          updatedAt
          chapterId
          closedAt
          state
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
          coach {
            id
            handle
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
