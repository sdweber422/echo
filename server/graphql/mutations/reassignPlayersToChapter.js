import {GraphQLNonNull, GraphQLID} from 'graphql'
import {GraphQLList} from 'graphql/type'

import {userCan} from 'src/common/util'
import reassignPlayersToChapter from 'src/server/actions/reassignPlayersToChapter'
import {Chapter, errors} from 'src/server/services/dataService'
import {User} from 'src/server/graphql/schemas'
import {LGNotAuthorizedError, LGBadRequestError} from 'src/server/util/error'

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

    const chapter = await Chapter.get(chapterId)
      .catch(errors.DocumentNotFound, () => {
        throw new LGBadRequestError(`Invalid chapter ID ${chapterId}`)
      })

    return await reassignPlayersToChapter(playerIds, chapterId)
      .then(updatedPlayers => (
        updatedPlayers.map(player => (
          Object.assign({}, player, {chapter}
        )))
      ))
  }
}
