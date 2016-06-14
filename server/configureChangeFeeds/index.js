import {PRACTICE, REFLECTION} from '../../common/models/cycle'
import {getQueue} from '../util'
import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'

export default function configureChangeFeeds() {
  newChapters(getQueue('newChapter'))
  newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
  cycleStateChanged({
    [PRACTICE]: getQueue('cycleLaunched'),
    [REFLECTION]: getQueue('cycleReflectionStarted'),
  })
}
