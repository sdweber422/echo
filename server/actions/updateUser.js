import {Player, Phase} from 'src/server/services/dataService'

export default async function updateUser(values) {
  const phaseNumber = values.phaseNumber
  const phase = await Phase.filter({number: phaseNumber}).nth(0)
  const player = await Player.get(values.id).update({phaseId: phase.id})
  return player
}
