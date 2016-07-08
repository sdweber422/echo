import {GOAL_SELECTION, PRACTICE, REFLECTION, COMPLETE} from '../../common/models/cycle'
import {getQueue} from '../util'
import newChapters from './newChapters'
import newOrUpdatedVotes from './newOrUpdatedVotes'
import cycleStateChanged from './cycleStateChanged'
import surveyResponseSubmitted from './surveyResponseSubmitted'

export default function configureChangeFeeds() {
  try {
    newChapters(getQueue('newChapter'))
    newOrUpdatedVotes(getQueue('newOrUpdatedVote'))
    surveyResponseSubmitted(getQueue('surveyResponseSubmitted'))
    cycleStateChanged({
      [GOAL_SELECTION]: getQueue('cycleInitialized'),
      [PRACTICE]: getQueue('cycleLaunched'),
      [REFLECTION]: getQueue('cycleReflectionStarted'),
      [COMPLETE]: getQueue('cycleCompleted'),
    })
  } catch (e) {
    console.error(`ERROR Configuring Change Feeds: ${e.stack ? e.stack : e}`)
    throw (e)
  }
}
