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
            voterPlayerIds
            users {
              id
            }
            phase {
              id
              number
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
