export default function findMyProjects(identifiers) {
  return {
    variables: {identifiers},
    query: `
      query {
        findMyProjects {
          id
          name
          state
          playerIds
          createdAt
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
