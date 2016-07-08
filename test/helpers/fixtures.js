/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from '../../test/factories'
import {
  getCycleIds,
  getTeamPlayerIds,
  setProjectReviewSurveyForCycle,
  setRetrospectiveSurveyForCycle,
} from '../../server/db/project'
import {getCycleById} from '../../server/db/cycle'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subject}) {
        try {
          this.project = await factory.create('project')
          const cycleIds = getCycleIds(this.project)
          this.cycleId = cycleIds[cycleIds.length - 1]

          this.teamPlayerIds = getTeamPlayerIds(this.project, this.cycleId)

          this.question = await factory.create('question', questionAttrs)
          this.survey = await factory.create('survey', {
            questionRefs: [{questionId: this.question.id, subject: subject()}]
          })
          await setRetrospectiveSurveyForCycle(this.project.id, this.cycleId, this.survey.id)
        } catch (e) {
          throw (e)
        }
      }
    })
  },
  buildSurvey() {
    beforeEach(function () {
      this.buildSurvey = async function (questionRefs) {
        try {
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
              subject: () => playerId,
              questionId: this.surveyQuestion.id
            }))
          }

          this.survey = await factory.create('survey', {
            questionRefs: questionRefs.map(({questionId, subject}) => ({questionId, subject: subject()}))
          })
          await setRetrospectiveSurveyForCycle(this.project.id, this.cycleId, this.survey.id)

          return this.survey
        } catch (e) {
          throw (e)
        }
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
            {name: 'A', questionId: this.questionA.id, subject: this.project.id},
            {name: 'B', questionId: this.questionB.id, subject: this.project.id},
          ]
        }

        this.survey = await factory.create('survey', {questionRefs})
        await setProjectReviewSurveyForCycle(this.project.id, this.cycle.id, this.survey.id)
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
