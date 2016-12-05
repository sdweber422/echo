import {GraphQLNonNull} from 'graphql'
import {GraphQLError} from 'graphql/error'

import {userCan} from 'src/common/util'
import {chapterSchema} from 'src/common/validations'
import {saveChapter} from 'src/server/db/chapter'
import {Chapter, InputChapter} from 'src/server/graphql/schemas'

export default {
  type: Chapter,
  args: {
    chapter: {type: new GraphQLNonNull(InputChapter)},
  },
  async resolve(source, {chapter}, {rootValue: {currentUser}}) {
    if (chapter.id && !userCan(currentUser, 'updateChapter') || !chapter.id && !userCan(currentUser, 'createChapter')) {
      throw new GraphQLError('You are not authorized to do that.')
    }

    await chapterSchema.validate(chapter) // validation error will be thrown if invalid

    const result = await saveChapter(chapter, {returnChanges: true})
    if (result.replaced || result.inserted) {
      return result.changes[0].new_val
    }

    throw new GraphQLError('Could not save chapter, please try again')
  }
}
