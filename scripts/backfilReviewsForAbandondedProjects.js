import Promise from 'bluebird'
import parseArgs from 'minimist'
import {connect} from 'src/db'
import {Survey, Response, Project} from 'src/server/services/dataService'
import {PROJECT_STATES} from 'src/common/models/project'
import getUser from 'src/server/actions/getUser'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import closeProject from 'src/server/actions/closeProject'
import {avg} from 'src/common/util'
import {finish} from './util'

const {
  REVIEW
} = PROJECT_STATES

const r = connect()

const COMPLETENESS_QUESTION_ID = '65cad3c5-e9e9-4284-999b-3a72c481c55e'

run()
  .then(() => finish(null))
  .catch(err => finish(err))

async function run() {
  const {
    user: userIdentifier,
  } = parseArgs(process.argv.slice(2))

  if (!userIdentifier) {
    /* eslint-disable unicorn/no-process-exit */
    console.log('USAGE: scripts/backfilReviewsForAbandondedProjects.js --user <username>')
    process.exit(1)
  }
  const reviewer = await getUser(userIdentifier)
  const projects = await getProjectsToClose()

  await Promise.each(projects, async project => {
    const averageInternalCompleteness = await getAverageInternalCompleteness(project)
    const retroSurvey = await Survey.get(project.retrospectiveSurveyId)

    console.log(`Putting project ${project.name} in review`)
    await Project.get(project.id).update({state: REVIEW})

    console.log(`Saving external completeness review of ${averageInternalCompleteness}`)
    await saveSurveyResponse({
      respondentId: reviewer.id,
      values: [{
        subjectId: project.id,
        value: averageInternalCompleteness,
      }],
      surveyId: retroSurvey.id,
      questionId: COMPLETENESS_QUESTION_ID,
    })

    console.log('Closing project')
    await closeProject(project.id)
  })
}

async function getAverageInternalCompleteness(project) {
  const responses = await Response
    .getAll(project.retrospectiveSurveyId, {index: 'surveyId'})
    .filter({questionId: COMPLETENESS_QUESTION_ID})

  return avg(responses.map(_ => _.value))
}

function getProjectsToClose() {
  const retrosComplete = ({project, survey}) => survey('completedBy').count().eq(project('playerIds').count())
  const twoWeeksAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7 * 2)

  return r.table('projects')
    .filter(_ => r.and(
      _('state').ne('CLOSED'),
      _('createdAt').lt(twoWeeksAgo),
      _('createdAt').gt(new Date(Date.parse('February 26, 2017'))) // cycle 33 and up
    ))
    .eqJoin('retrospectiveSurveyId', r.table('surveys'))
    .filter(_ => retrosComplete({project: _('left'), survey: _('right')}))
    .map(_ => _('left'))
}
