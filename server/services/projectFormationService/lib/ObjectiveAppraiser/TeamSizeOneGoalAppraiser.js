import {getTeamSizeForGoal, getVotesByPlayerId, getGoalsWithVotes, emptySeatsByGoal} from '../pool'
import PlayersGotTheirVoteAppraiser from './PlayersGotTheirVoteAppraiser'

export default class TeamSizeOneGoalAppraiser extends PlayersGotTheirVoteAppraiser {
  constructor(pool) {
    super(pool)
    this.pool = pool
    this.votesByPlayerId = getVotesByPlayerId(pool)
    this.secondChoiceValue = 0

  }

// players vote for team size one goals

  score(teamFormationPlan, {teamsAreIncomplete} = {}) {
    const {teams} = teamFormationPlan
    console.log('>>DUMP:', JSON.stringify(this.pool, null, 4))
    console.log('teams are incomplete ===>', teamsAreIncomplete)

    const playersWhoVotedForSizeOne = this.pool.votes.filter(player =>
      getTeamSizeForGoal(this.pool, player.votes[0]) === 1
    ).map(_ => _.playerId)


    if(!teamsAreIncomplete) {
      const numPlayersGotTheirVote = teams.filter(team =>
        this.playerGotTheirVote(team)
      ).length

      const allTeamSizeOneVotes = playersWhoVotedForSizeOne.length

      console.log('numPlayersGotTheirVote', numPlayersGotTheirVote)
      console.log('allTeamSizeOneVotes', allTeamSizeOneVotes)

      return numPlayersGotTheirVote / allTeamSizeOneVotes
    } else {
      const unassignedPlayerIds = this.getUnassignedPlayers(teams)
      const unassignedPlayersWhoVotedOne = unassignedPlayerIds.filter(id =>
        playersWhoVotedForSizeOne.includes(id)
      )
      console.log({unassignedPlayersWhoVotedOne});
      const rawScoreForUnassignedPlayers = this.bestPossibleRawScoreForUnassignedPlayers(
        teamFormationPlan,
        new Set(unassignedPlayersWhoVotedOne), 
        unassignedPlayerIds.length
      )

      const remainingSeats = this.getRemainingSeatCount(teams, teamFormationPlan.seatCount)
      const score = rawScoreForUnassignedPlayers / unassignedPlayersWhoVotedOne.length

      console.log('rawScoreForUnassignedPlayers', rawScoreForUnassignedPlayers)
      console.log('unassignedPlayerIds', unassignedPlayerIds)
      return score

    }
  }

 getRemainingSeatCount(teams, seatCount) {
    const occupiedSeatsCount = teams.reduce((occupiedSeats, team) => {
      if (team.playerIds.length) {
        return occupiedSeats + team.playerIds.length
      }

      return occupiedSeats
    }, 0)

    return seatCount - occupiedSeatsCount
  }

  getUnassignedPlayers(teams) {
    const playerIds = []
    const players = teams.reduce((playerIds, team) =>
      playerIds.concat(team.playerIds)
    ,[])

    this.pool.votes.forEach(player =>
      !players.includes(player.playerId) ? playerIds.push(player.playerId) : null
    )
    return playerIds
  }

  playerGotTheirVote(team) {
    if(team.teamSize !== 1) {
      return false
    }
    const playerVotes = this.votesByPlayerId[team.playerIds[0]]
    if(playerVotes[0] === team.goalDescriptor) {
      return true
    }
  }
}

// use teamsAreIncomplete: true somewhere in this code.

// const unAssignedTeams = teams.filter(team =>
//   getGoalsWithVotes(this.pool) === 0
// ).length

// getUnassignedPlayers(teams) {
//   const goalDescriptors = teams.map(goal => goal.goalDescriptor)
//   const unassignedPlayerIds = []
//   this.pool.votes.map(player => {
//     if (!teamSize.includes(playerIds[0])) {
//       unassignedPlayerIds.push(player.playerId)
//     }
//   })
//   return unassignedPlayerIds
// }
