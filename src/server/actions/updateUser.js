import {Member, Phase} from 'src/server/services/dataService'

export default async function updateUser(values) {
  const phaseNumber = values.phaseNumber
  const phase = phaseNumber ? await Phase.filter({number: phaseNumber}).nth(0) : {id: null}
  const member = await Member.get(values.id).update({phaseId: phase.id})
  return member
}
