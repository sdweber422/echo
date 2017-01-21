/* eslint-disable import/imports-first */
global.__SERVER__ = true

const Promise = require('bluebird')
const {Project} = require('src/server/services/dataService')
const {buildSurvey} = require('src/server/actions/ensureCycleReflectionSurveysExist')
const {RETROSPECTIVE_DESCRIPTOR, PROJECT_REVIEW_DESCRIPTOR} = require('src/common/models/surveyBlueprint')
const {finish} = require('./util')

const items = [
  'adventurous-chimpanzee',
  'unsightly-pademelon',
]

run()
  .then(() => finish())
  .catch(err => finish(err))

async function run() {
  const errors = []

  console.log(`Creating surveys for ${items.length} project(s)`)

  return Promise.each(items, async projectName => {
    try {
      const projects = await Project.filter({name: projectName})
      if (projects.length === 0) {
        throw new Error(`Project ${projectName} not found`)
      }
      const project = projects[0]
      console.log('\nproject:', project.name)
      console.log('project.retrospectiveSurveyId:', project.retrospectiveSurveyId)
      console.log('project.projectReviewSurveyId:', project.projectReviewSurveyId)
      if (!project.retrospectiveSurveyId) {
        console.log('creating retro')
        await createProjectSurvey(project, RETROSPECTIVE_DESCRIPTOR)
      }
      if (!project.projectReviewSurveyId) {
        console.log('creating review')
        await createProjectSurvey(project, PROJECT_REVIEW_DESCRIPTOR)
      }
      const updatedProject = await Project.filter({name: project.name})
      console.log('\nproject:', updatedProject.name)
      console.log('project.retrospectiveSurveyId:', updatedProject.retrospectiveSurveyId)
      console.log('project.projectReviewSurveyId:', updatedProject.projectReviewSurveyId)
    } catch (err) {
      errors.push(err)
    }
  })
}

async function createProjectSurvey(project, surveyDescriptor) {
  console.log('createProjectSurvey:', surveyDescriptor)
  const surveyId = await buildSurvey(project, surveyDescriptor, {force: true})
  console.log('surveyId:', surveyId)
  return Project.get(project.id).update({[`${surveyDescriptor}SurveyId`]: surveyId})
}
