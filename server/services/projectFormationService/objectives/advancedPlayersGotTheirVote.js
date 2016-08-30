import playersGotTheirVote from './playersGotTheirVote'

export default function advancedPlayersGotTheirVote(pool, teamFormationPlan) {
  return playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})
}
