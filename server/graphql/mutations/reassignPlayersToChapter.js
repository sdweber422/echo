import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {connect} from 'src/db'
import {userCan} from 'src/common/util'
import {reassignPlayersToChapter} from 'src/server/db/player'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'

const r = connect()

export default {
  type: new GraphQLList(User),
  args: {
    playerIds: {type: new GraphQLList(GraphQLID)},
    chapterId: {type: new GraphQLNonNull(GraphQLID)},
  },
  async resolve(source, {playerIds, chapterId}, {rootValue: {currentUser}}) {
    if (!userCan(currentUser, 'reassignPlayersToChapter')) {
      throw new LGNotAuthorizedError()
    }

    const chapter = await r.table('chapters').get(chapterId).run()
    if (!chapter) {
      throw new LGBadRequestError('No such chapter.')
    }

    return await reassignPlayersToChapter(playerIds, chapterId)
      .then(updatedPlayers => updatedPlayers.map(player => Object.assign({}, player, {chapter})))
  }
}
