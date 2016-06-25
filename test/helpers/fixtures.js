/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../db/connect'
import factory from '../../test/factories'
import {REFLECTION, COMPLETE} from '../../common/models/cycle'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subject}) {
        try {
          this.project = await factory.create('project')
          const cycleIds = Object.keys(this.project.cycleTeams)
          const cycleQuery = r.table('cycles').getAll(...cycleIds).orderBy(r.desc('cycleNumber'))
          await cycleQuery
            .update({
              state: r.branch(
                r.row('cycleNumber').eq(cycleQuery.max('cycleNumber')('cycleNumber')),
                REFLECTION,
                COMPLETE,
              )
            }, {nonAtomic: true}).run()
          this.cycleId = await cycleQuery.nth(0)('id')

          this.teamPlayerIds = this.project.cycleTeams[this.cycleId].playerIds

          this.question = await factory.create('question', questionAttrs)
          this.survey = await factory.build('survey', {
            cycleId: this.cycleId,
            projectId: this.project.id,
            questionRefs: [{questionId: this.question.id, subject: subject()}]
          })
            .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
            .then(result => result.changes[0].new_val)
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
          const cycleIds = Object.keys(this.project.cycleTeams)
          const cycleQuery = r.table('cycles').getAll(...cycleIds).orderBy(r.desc('cycleNumber'))
          await cycleQuery
            .update({
              state: r.branch(
                r.row('cycleNumber').eq(cycleQuery.max('cycleNumber')('cycleNumber')),
                REFLECTION,
                COMPLETE,
              )
            }, {nonAtomic: true}).run()
          this.cycleId = await cycleQuery.nth(0)('id')

          this.teamPlayerIds = this.project.cycleTeams[this.cycleId].playerIds

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

          this.survey = await factory.build('survey', {
            cycleId: this.cycleId,
            projectId: this.project.id,
            questionRefs: questionRefs.map(({questionId, subject}) => ({questionId, subject: subject()}))
          })
            .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
            .then(result => result.changes[0].new_val)

          return this.survey
        } catch (e) {
          throw (e)
        }
      }
    })
  },
  setCurrentCycleAndUserForProject() {
    beforeEach(function () {
      this.setCurrentCycleAndUserForProject = async function (project) {
        const cycles = await r.table('cycles').getAll(...Object.keys(project.cycleTeams))
        this.currentCycle = cycles.reduce((lastCycle, cycle) => {
          return lastCycle && (lastCycle.cycleNumber > cycle.cycleNumber) ? lastCycle : cycle
        }, null)
        this.currentUser = await factory.build('user', {id: project.cycleTeams[this.currentCycle.id].playerIds[0]})
      }
    })
  },
}
