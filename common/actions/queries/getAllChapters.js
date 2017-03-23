export default function findChapters() {
  return {
    variables: {},
    query: `
      query {
        getAllChapters {
          id
          name
          channelName
          inviteCodes
          activeProjectCount
          activePlayerCount
          latestCycle {
            id
            cycleNumber
            state
          }
        }
      }
    `,
  }
}
