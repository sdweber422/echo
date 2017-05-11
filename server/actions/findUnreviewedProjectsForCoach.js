import {Project} from 'src/server/services/dataService'
import {REVIEW} from 'src/common/models/project'

export default async function findUnreviewedProjectsForCoach(coachId) {
  const projects = await Project
    .filter({
      coachId,
      state: REVIEW,
    })
    .getJoin({projectReviewSurvey: true})
    .filter(_ =>
      _('projectReviewSurvey')('completedBy').default([]).contains(coachId).not()
    )
    .without('projectReviewSurvey')

  return projects
}
