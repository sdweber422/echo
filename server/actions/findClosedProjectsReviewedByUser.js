import {Response, Project, r} from 'src/server/services/dataService'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {CLOSED} from 'src/common/models/project'

const {PROJECT_COMPLETENESS} = STAT_DESCRIPTORS

export default async function findClosedProjectsReviewedByUser(userId, {since = r.minval, before = r.maxval} = {}) {
  const projectReviewResponses = Response
    .between(since, before, {index: 'createdAt', leftBound: 'open'})
    .getJoin({question: {stat: true}})
    .filter({respondentId: userId})
    .filter(_ =>
      _('question')('stat')('descriptor').eq(PROJECT_COMPLETENESS)
    )

  const projectIds = (
    await projectReviewResponses.pluck('subjectId').distinct().execute()
  ).map(_ => _.subjectId)

  return Project
    .getAll(...projectIds)
    .filter({state: CLOSED})
}
