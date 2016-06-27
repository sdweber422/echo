import {PRACTICE, REFLECTION} from '../../common/models/cycle'
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
      [PRACTICE]: getQueue('cycleLaunched'),
      [REFLECTION]: getQueue('cycleReflectionStarted'),
    })
  } catch (e) {
    console.error(`ERROR Configuring Change Feeds: ${e.stack ? e.stack : e}`)
    throw (e)
  }
}
