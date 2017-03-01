import {Response, Project} from 'src/server/services/dataService'
import {groupById} from 'src/server/util'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

const {PROJECT_COMPLETENESS, PROJECT_QUALITY} = STAT_DESCRIPTORS

export default async function findProjectsReviewedByUser(userId, {since, before} = {}) {
  let projectReviewResponses = Response
    .getJoin({question: {stat: true}})
    .filter({respondentId: userId})
    .filter(_ =>
      _('question')('stat')('descriptor').eq(PROJECT_COMPLETENESS).or(
      _('question')('stat')('descriptor').eq(PROJECT_QUALITY))
    )

  if (since) {
    projectReviewResponses = projectReviewResponses.filter(_ => _('createdAt').gt(since))
  }
  if (before) {
    projectReviewResponses = projectReviewResponses.filter(_ => _('createdAt').lt(before))
  }

  const responsesByProjectId = groupById(await projectReviewResponses, 'subjectId')

  const projectIds = Array.from(responsesByProjectId).reduce((result, [projectId, responses]) => {
    const hasResponse = stat => responses.some(_ => _.question.stat.descriptor === stat)
    if (!(hasResponse(PROJECT_COMPLETENESS) && hasResponse(PROJECT_QUALITY))) {
      return result
    }

    return [...result, projectId]
  }, [])

  return await Project.getAll(...projectIds)
}

