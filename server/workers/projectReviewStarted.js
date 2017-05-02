import {
  sendReviewNotificationToCoach,
  sendReviewNotificationToPlayers,
} from './util/projectReview'

export function start() {
  const jobService = require('src/server/services/jobService')
  jobService.processJobs('projectReviewStarted', processProjectReviewStarted)
}

export async function processProjectReviewStarted(project) {
  await Promise.all([
    sendReviewNotificationToPlayers(project),
    sendReviewNotificationToCoach(project),
  ])
}
