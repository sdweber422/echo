import playersGotTheirVote from './playersGotTheirVote'

export default function nonAdvancedPlayersGotTheirVote(pool, teams) {
  return playersGotTheirVote(pool, teams, {advancedPlayersOnly: true})
}
