import {getQueue} from '../util'
import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleLaunched from './cycleLaunched'

export default function configureChangeFeeds() {
  newChapters(getQueue('newChapters'))
  newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
  cycleLaunched(getQueue('cycleLaunched'))
}
