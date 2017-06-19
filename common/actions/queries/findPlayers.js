export default function findPlayers() {
  return {
    variables: {},
    query: `
      query {
        findPlayers {
          id
          chapter {
            id
            name
            channelName
            timezone
            inviteCodes
          }
          createdAt
          updatedAt
        }
      }
    `,
  }
}
