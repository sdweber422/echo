import playersGotTheirVote from './playersGotTheirVote'

export default function nonAdvancedPlayersGotTheirVote(pool, teamFormationPlan) {
  return playersGotTheirVote(pool, teamFormationPlan, {advancedPlayersOnly: true})
}
