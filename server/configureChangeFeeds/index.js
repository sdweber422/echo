import {getQueue} from '../util'
import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'
import {PRACTICE, RETROSPECTIVE} from '../../common/models/cycle'

export default function configureChangeFeeds() {
  newChapters(getQueue('newChapter'))
  newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
  cycleStateChanged({
    [PRACTICE]: getQueue('cycleLaunched'),
    [RETROSPECTIVE]: getQueue('cycleRetrospectiveStarted'),
  })
}
