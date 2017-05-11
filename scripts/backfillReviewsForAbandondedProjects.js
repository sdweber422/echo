import Promise from 'bluebird'
import parseArgs from 'minimist'
import {Survey, Response, Project, findProjectsToClose} from 'src/server/services/dataService'
import {REVIEW} from 'src/common/models/project'
import getUser from 'src/server/actions/getUser'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'
import closeProject from 'src/server/actions/closeProject'
import {avg} from 'src/common/util'
import {finish} from './util'

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
    console.log('USAGE: scripts/backfillReviewsForAbandondedProjects.js --user <username>')
    process.exit(1)
  }
  const reviewer = await getUser(userIdentifier)
  const projects = await findProjectsToClose()

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
