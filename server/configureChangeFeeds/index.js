import {PRACTICE, REFLECTION} from '../../common/models/cycle'
import {getQueue} from '../util'
import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'
import retrospectiveSurveyCompleted from './retrospectiveSurveyCompleted'

export default function configureChangeFeeds() {
  try {
    newChapters(getQueue('newChapter'))
    newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
    retrospectiveSurveyCompleted(getQueue('retrospectiveSurveyCompleted'))
    cycleStateChanged({
      [PRACTICE]: getQueue('cycleLaunched'),
      [REFLECTION]: getQueue('cycleReflectionStarted'),
    })
  } catch (e) {
    console.error(`ERROR Configuring Change Feeds: ${e.stack ? e.stack : e}`)
    throw (e)
  }
}
