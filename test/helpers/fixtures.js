/* eslint-env mocha */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import r from '../../db/connect'
import factory from '../../test/factories'
import {RETROSPECTIVE, COMPLETE} from '../../common/models/cycle'

export const useFixture = {
  buildOneQuestionSurvey() {
    beforeEach(function () {
      this.buildOneQuestionSurvey = async function ({questionAttrs, subject}) {
        try {
          this.project = await factory.create('project')
          const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
          await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
          await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

          this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds

          this.question = await factory.create('question', questionAttrs)
          this.survey = await factory.build('survey', {
            cycleId,
            projectId: this.project.id,
            questions: [{questionId: this.question.id, subject: subject()}]
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
      this.buildSurvey = async function (surveyItems) {
        try {
          this.project = await factory.create('project')
          const [cycleId, ...otherCycleIds] = Object.keys(this.project.cycleTeams)
          await r.table('cycles').get(cycleId).update({state: RETROSPECTIVE}).run()
          await r.table('cycles').getAll(...otherCycleIds).update({state: COMPLETE}).run()

          this.teamPlayerIds = this.project.cycleTeams[cycleId].playerIds

          this.survey = await factory.build('survey', {
            cycleId,
            projectId: this.project.id,
            questions: surveyItems.map(({questionId, subject}) => ({questionId, subject: subject()}))
          })
            .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
            .then(result => result.changes[0].new_val)
        } catch (e) {
          throw (e)
        }
      }
    })
  }
}
