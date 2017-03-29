export default function getCycleVotingResults() {
  return {
    query: `
      query {
        getCycleVotingResults {
          id
          cycle {
            id
            cycleNumber
            startTimestamp
            state
            chapter {
              id
              name
              channelName
              timezone
              githubTeamId
            }
          }
          pools {
            id
            name
            levels
            voterPlayerIds
            users {
              id
            }
            votingIsStillOpen
            candidateGoals {
              goal {
                number
                url
                title
              }
              playerGoalRanks {
                playerId
                goalRank
              }
            }
          }
        }
      }
    `,
  }
}
