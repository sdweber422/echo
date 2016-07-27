/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from '../../test/factories'
import {
  getCycleIds,
  getProjectById,
  getTeamPlayerIds,
  setProjectReviewSurveyForCycle,
  setRetrospectiveSurveyForCycle,
  table as projectsTable,
} from '../../server/db/project'
import {getCycleById} from '../../server/db/cycle'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subjectIds}) {
        this.project = await factory.create('project')
        const cycleIds = getCycleIds(this.project)
        this.cycleId = cycleIds[cycleIds.length - 1]

        this.teamPlayerIds = getTeamPlayerIds(this.project, this.cycleId)

        this.question = await factory.create('question', questionAttrs)
        this.survey = await factory.create('survey', {
          questionRefs: [{questionId: this.question.id, subjectIds: subjectIds()}]
        })
        await setRetrospectiveSurveyForCycle(this.project.id, this.cycleId, this.survey.id)
      }
    })
  },
  buildSurvey() {
    beforeEach(function () {
      this.buildSurvey = async function (questionRefs) {
        this.project = await factory.create('project')
        const cycleIds = getCycleIds(this.project)
        this.cycleId = cycleIds[cycleIds.length - 1]

        this.teamPlayerIds = getTeamPlayerIds(this.project, this.cycleId)

        if (!questionRefs) {
          this.surveyQuestion = await factory.create('question', {
            subjectType: 'player',
            responseType: 'text',
          })
          questionRefs = this.teamPlayerIds.map(playerId => ({
            subjectIds: () => [playerId],
            questionId: this.surveyQuestion.id
          }))
        }

        this.survey = await factory.create('survey', {
          questionRefs: questionRefs.map(({questionId, subjectIds}) => ({questionId, subjectIds: subjectIds()}))
        })
        await setRetrospectiveSurveyForCycle(this.project.id, this.cycleId, this.survey.id)
        this.project = await getProjectById(this.project.id)

        return this.survey
      }
    })
  },
  createProjectReviewSurvey() {
    beforeEach(function () {
      this.createProjectReviewSurvey = async function(questionRefs) {
        this.chapter = await factory.create('chapter')
        this.project = await factory.create('project', {chapterId: this.chapter.id})
        const cycleIds = await getCycleIds(this.project)
        this.cycle = await getCycleById(cycleIds[cycleIds.length - 1])
        this.teamPlayerIds = getTeamPlayerIds(this.project, this.cycle.id)

        if (!questionRefs) {
          this.questionA = await factory.create('question',
            {body: 'A', responseType: 'percentage', subjectType: 'project'})
          this.questionB = await factory.create('question',
            {body: 'B', responseType: 'percentage', subjectType: 'project'})
          questionRefs = [
            {name: 'A', questionId: this.questionA.id, subjectIds: [this.project.id]},
            {name: 'B', questionId: this.questionB.id, subjectIds: [this.project.id]},
          ]
        }

        this.survey = await factory.create('survey', {questionRefs})
        await setProjectReviewSurveyForCycle(this.project.id, this.cycle.id, this.survey.id)
      }
    })
  },
  createChapterInReflectionState() {
    beforeEach(function () {
      this.createChapterInReflectionState = async function() {
        this.chapter = await factory.create('chapter')
        this.projects = await factory.buildMany('project', {chapterId: this.chapter.id}, 4)
        // make sure cycles line up for all projects
        this.projects.slice(1).forEach(project => {
          project.cycleHistory.forEach((hist, j) => {
            hist.cycleId = this.projects[0].cycleHistory[j].cycleId
          })
        })
        await projectsTable.insert(this.projects)
        const cycleIds = await getCycleIds(this.projects[0])
        this.cycle = await getCycleById(cycleIds[cycleIds.length - 1])
        this.teamPlayerIds = await getTeamPlayerIds(this.projects[0], this.cycle.id)

        // create a project review survey for each project
        this.surveys = await Promise.all(this.projects.map(async project => {
          return (async () => {
            const questionData = {responseType: 'percentage', subjectType: 'project'}
            const questions = await factory.createMany('question', [
              Object.assign({}, questionData, {body: 'completeness'}),
              Object.assign({}, questionData, {body: 'quality'}),
            ], 2)
            const questionRefs = questions.map(question => ({
              name: question.body,
              questionId: question.id,
              subjectIds: [project.id],
            }))
            const survey = await factory.create('survey', {questionRefs})
            await setProjectReviewSurveyForCycle(project.id, this.cycle.id, survey.id)
            return survey
          })()
        }))
      }
    })
  },
  setCurrentCycleAndUserForProject() {
    beforeEach(function () {
      this.setCurrentCycleAndUserForProject = async function (project) {
        const mostRecentHistoryItem = await project.cycleHistory[project.cycleHistory.length - 1]
        this.currentCycle = await getCycleById(mostRecentHistoryItem.cycleId)
        this.currentUser = await factory.build('user', {id: mostRecentHistoryItem.playerIds[0]})
      }
    })
  },
}
