import {GraphQLNonNull, GraphQLString, GraphQLID} from 'graphql'
import {GraphQLInputObjectType, GraphQLList} from 'graphql/type'
import {GraphQLError} from 'graphql/error'
import {GraphQLDateTime, GraphQLURL} from 'graphql-custom-types'

import {saveChapter} from 'src/server/db/chapter'
import {userCan} from 'src/common/util'
import {chapterSchema} from 'src/common/validations'
import {handleError} from 'src/server/graphql/models/util'
import {Chapter} from './schema'

const InputChapter = new GraphQLInputObjectType({
  name: 'InputChapter',
  description: 'The chapter',
  fields: () => ({
    id: {type: GraphQLID, description: 'The chapter UUID'},
    name: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter name'},
    channelName: {type: new GraphQLNonNull(GraphQLString), description: 'The chapter chat channel name'},
    timezone: {type: GraphQLString, description: 'The chapter timezone'},
    goalRepositoryURL: {type: new GraphQLNonNull(GraphQLURL), description: 'The GitHub goal repository URL'},
    cycleDuration: {type: new GraphQLNonNull(GraphQLString), description: 'The cycle duration'},
    cycleEpoch: {type: GraphQLDateTime, description: 'The start timestamp of the first cycle'},
    inviteCodes: {type: new GraphQLList(GraphQLString), description: 'The invite codes associated with this chapter'},
  })
})

export default {
  createOrUpdateChapter: {
    type: Chapter,
    args: {
      chapter: {type: new GraphQLNonNull(InputChapter)},
    },
    async resolve(source, {chapter}, {rootValue: {currentUser}}) {
      if (chapter.id && !userCan(currentUser, 'updateChapter') || !chapter.id && !userCan(currentUser, 'createChapter')) {
        throw new GraphQLError('You are not authorized to do that.')
      }
      try {
        await chapterSchema.validate(chapter) // validation error will be thrown if invalid
        const result = await saveChapter(chapter, {returnChanges: true})

        if (result.replaced || result.inserted) {
          return result.changes[0].new_val
        }
        throw new GraphQLError('Could not save chapter, please try again')
      } catch (err) {
        handleError(err)
      }
    }
  },
}
