import {Response, Project} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {connect} from 'src/db'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_STATES} from 'src/common/models/project'

const r = connect()

const {PROJECT_COMPLETENESS, PROJECT_QUALITY} = STAT_DESCRIPTORS

export default async function findClosedProjectsReviewedByUser(userId, {since = r.minval, before = r.maxval} = {}) {
  const projectReviewResponses = Response
    .between(since, before, {index: 'createdAt', leftBound: 'open'})
    .getJoin({question: {stat: true}})
    .filter({respondentId: userId})
    .filter(_ =>
      _('question')('stat')('descriptor').eq(PROJECT_COMPLETENESS).or(
      _('question')('stat')('descriptor').eq(PROJECT_QUALITY))
    )

  const responsesByProjectId = groupById(await projectReviewResponses, 'subjectId')

  const projectIds = Array.from(responsesByProjectId).reduce((result, [projectId, responses]) => {
    const hasResponse = stat => responses.some(_ => _.question.stat.descriptor === stat)
    if (!(hasResponse(PROJECT_COMPLETENESS) && hasResponse(PROJECT_QUALITY))) {
      return result
    }

    return [...result, projectId]
  }, [])

  return await Project.getAll(...projectIds).filter({state: PROJECT_STATES.CLOSED})
}

