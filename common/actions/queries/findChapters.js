export default function findChapters() {
  return {
    variables: {},
    query: `
      query {
        findChapters {
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
