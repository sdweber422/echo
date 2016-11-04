import {MIN_TEAM_SIZE} from '../pool'

export default function createTeamSizes(recTeamSize, numPlayers) {
  const numPerfectTeams = Math.floor(numPlayers / recTeamSize)

  // form as many perfect teams as possible
  const teamSizes = new Array(numPerfectTeams).fill(null)
    .map(() => recTeamSize)

  // any players "left over"?
  const remainingPlayers = (numPlayers % recTeamSize) || 0

  if (remainingPlayers) {
    const minTeamSize = Math.max(MIN_TEAM_SIZE, recTeamSize - 1)
    const maxTeamSize = recTeamSize + 1

    if (remainingPlayers >= minTeamSize && remainingPlayers <= maxTeamSize) {
      teamSizes.push(remainingPlayers)
    } else if (remainingPlayers <= teamSizes.length) {
      // teams can be rec size + 1, and there are few enough remaining spots that
      // we can add each of them to an existing (previously "perfect-sized") team
      for (let i = 0; i < remainingPlayers; i++) {
        teamSizes[i]++
      }
    } else if (teamSizes.length > 0 && (remainingPlayers + teamSizes.length) <= minTeamSize) {
      // teams can be rec size - 1, and there are enough "perfect-sized" teams
      // that we can take 1 spot from the players of some them and
      // add those to the leftover spots to make 1 more team
      let remainingTeamSize = remainingPlayers
      for (let i = 0; remainingTeamSize < minTeamSize; i++) {
        teamSizes[i]--
        remainingTeamSize++
      }
      teamSizes.push(remainingTeamSize)
    } else {
      throw new Error('Could not find valid team sizes')
    }
  }

  return teamSizes
}
