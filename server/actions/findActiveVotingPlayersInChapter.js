import {Player} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {userCan} from 'src/common/util'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'

export default async function findActiveVotingPlayersInChapter(chapterId) {
  const players = await Player.filter({chapterId}).getJoin({phase: true})
  const playerIds = players.map(_ => _.id)
  const idmUsers = await getPlayerInfo(playerIds)
  const idmUserMap = mapById(idmUsers)
  return players.filter(player => {
    const idmUser = idmUserMap.get(player.id)
    return player.phase && player.phase.hasVoting && idmUser.active && !userCan(idmUser, 'beExcludedFromVoting')
  })
}
