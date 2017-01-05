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
