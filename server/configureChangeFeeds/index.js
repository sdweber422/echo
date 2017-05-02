import {GOAL_SELECTION, PRACTICE, REFLECTION, COMPLETE} from 'src/common/models/cycle'
import {REVIEW} from 'src/common/models/project'

import chapterCreated from './chapterCreated'
import cycleStateChanged from './cycleStateChanged'
import projectStateChanged from './projectStateChanged'
import projectArtifactChanged from './projectArtifactChanged'
import surveySubmitted from './surveySubmitted'
import voteSubmitted from './voteSubmitted'

export default function configureChangeFeeds() {
  const queueService = require('src/server/services/queueService')

  try {
    chapterCreated(queueService.getQueue('chapterCreated'))
    cycleStateChanged({
      [GOAL_SELECTION]: queueService.getQueue('cycleInitialized'),
      [PRACTICE]: queueService.getQueue('cycleLaunched'),
      [REFLECTION]: queueService.getQueue('cycleReflectionStarted'),
      [COMPLETE]: queueService.getQueue('cycleCompleted'),
    })
    projectStateChanged({
      [REVIEW]: queueService.getQueue('projectReviewStarted'),
    })
    projectArtifactChanged(queueService.getQueue('projectArtifactChanged'))
    surveySubmitted(queueService.getQueue('surveySubmitted'))
    voteSubmitted(queueService.getQueue('voteSubmitted'))
  } catch (err) {
    console.error(`ERROR Configuring Change Feeds: ${err.stack ? err.stack : err}`)
    throw (err)
  }
}
