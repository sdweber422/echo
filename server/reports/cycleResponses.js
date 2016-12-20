import Promise from 'bluebird'

import {connect} from 'src/db'
import {getChapter} from 'src/server/db/chapter'
import {getCycleForChapter} from 'src/server/db/cycle'
import getPlayerInfo from 'src/server/actions/getPlayerInfo'
import {mapById} from 'src/server/util'
import {writeCSV, parseCycleReportArgs} from './util'

const r = connect()

const DEFAULT_VALUES = {name: '?', handle: '?', email: '?', body: '?'}

export default function requestHandler(req, res) {
  return runReport(req.query, res)
    .then(result => writeCSV(result, res))
}

async function runReport(args) {
  const {chapterName, cycleNumber} = parseCycleReportArgs(args)

  const [chapter, questionsById] = await Promise.all([
    getChapter(chapterName),
    _mapQuestionsById(),
  ])

  const [cycle, playersById] = await Promise.all([
    getCycleForChapter(chapter.id, cycleNumber),
    _mapPlayersById(chapter),
  ])

  const projects = await r.table('projects').filter({chapterId: chapter.id, cycleId: cycle.id})
  const projectsById = mapById(projects)
  const projectSurveysById = await _mapProjectSurveysById(projects)

  const surveyResponseGroups = await Promise.map(projectSurveysById.values(), async survey => {
    const surveyResponses = await r.table('responses')
      .filter({surveyId: survey.id})
      .pluck('questionId', 'surveyId', 'respondentId', 'subjectId', 'value')
    return surveyResponses.map(response => {
      const question = Object.assign({}, DEFAULT_VALUES, questionsById.get(response.questionId) || {})
      const respondent = Object.assign({}, DEFAULT_VALUES, playersById.get(response.respondentId) || {})
      const subject = Object.assign({}, DEFAULT_VALUES, playersById.get(response.subjectId) || projectsById.get(response.subjectId) || {})
      return {
        cycleNumber,
        question: question.body,
        questionId: response.questionId,
        respondentEmail: respondent.email,
        respondentHandle: respondent.handle,
        respondentId: response.respondentId,
        respondentName: respondent.name,
        subject: subject.name,
        subjectId: response.subjectId,
        surveyId: response.surveyId,
        value: response.value,
      }
    })
  }, {concurrency: 5})

  return surveyResponseGroups.reduce((result, group) => result.concat(group), [])
}

async function _mapProjectSurveysById(projects) {
  const surveyIds = projects.reduce((result, p) => {
    if (p.retrospectiveSurveyId) {
      result.push(p.retrospectiveSurveyId)
    }
    if (p.projectReviewSurveyId) {
      result.push(p.projectReviewSurveyId)
    }
    return result
  }, [])
  const surveys = await r.table('surveys').getAll(...surveyIds)
  return mapById(surveys)
}

async function _mapPlayersById(chapter) {
  const players = await r.table('players').filter({chapterId: chapter.id}).pluck('id')
  const userIds = players.map(p => p.id)
  const users = await getPlayerInfo(userIds)
  return mapById(users)
}

async function _mapQuestionsById() {
  const questions = await r.table('questions')
  return mapById(questions)
}
