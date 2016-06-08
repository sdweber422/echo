/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {saveResponsesForQuestion} from '../response'
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveResponsesForQuestion', function () {
    beforeEach(async function () {
      try {
        this.project = await factory.create('project')
        this.teamPlayerIds = Object.values(this.project.cycleTeams)[0].playerIds
        this.question = await factory.create('question', {subjectType: 'team', responseType: 'percentage'})
        this.survey = await factory.build('survey', {
          questionRefs: [{questionId: this.question.id, subject: this.teamPlayerIds}]
        })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)
      } catch (e) {
        throw (e)
      }

      this.buildResponses = function (values) {
        return Promise.all(
          values.map((value, i) => {
            const subject = this.teamPlayerIds[i]
            return this.buildResponse({value, subject})
          })
        )
      }

      this.buildResponse = function ({value, subject}) {
        return factory.build('response', {
          value,
          subject,
          questionId: this.question.id,
          respondentId: this.teamPlayerIds[0],
          surveyId: this.survey.id,
          createAt: null,
          updatedAt: null,
        }).then(response => {
          delete response.id
          return response
        })
      }
    })

    it('saves multiple responses for the same question', async function () {
      try {
        const responsesToSave = await this.buildResponses([25, 25, 40, 10])

        const responseIds = await saveResponsesForQuestion(responsesToSave)

        const savedResponseCount = await r.table('responses').count().run()
        expect(savedResponseCount).to.eq(4)

        const savedResponses = await r.table('responses').getAll(...responseIds).run()
        savedResponses.forEach(response => {
          expect(response).to.have.property('createdAt').and.to.exist
          expect(response).to.have.property('updatedAt').and.to.exist
        })
        expect(savedResponses.map(r => r.value).sort()).to.deep.equal([10, 25, 25, 40])
        expect(savedResponses.map(r => r.subject).sort()).to.deep.equal(this.teamPlayerIds.sort())
      } catch (e) {
        throw (e)
      }
    })
  })
})
