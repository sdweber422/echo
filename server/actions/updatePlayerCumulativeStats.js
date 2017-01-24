import {findProjectReviewsForPlayer} from 'src/server/db/response'
import {Player} from 'src/server/services/dataService'

export default async function updatePlayerCumulativeStats(playerId) {
  const numProjectsReviewed = await findProjectReviewsForPlayer(playerId)
    .pluck('projectId')
    .distinct()
    .count()
  return Player.get(playerId).update({stats: {numProjectsReviewed}})
}
