/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import {saveResponse} from '../response'
import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveResponse', function () {
    beforeEach(async function () {
      try {
        this.project = await factory.create('project')
        this.teamIds = Object.values(this.project.cycleTeams)[0].playerIds
        this.question = await factory.create('question', {subjectType: 'team', type: 'percentage'})
        this.survey = await factory.build('survey', {
            questions: [{questionId: this.question.id, subject: this.teamIds}]
          })
          .then(survey => r.table('surveys').insert(survey, {returnChanges: true}).run())
          .then(result => result.changes[0].new_val)

        this.buildResponse = function(values) {
          return factory.build('response', {
            questionId: this.question.id,
            respondantId: this.teamIds[0],
            value: values,
            surveyId: this.survey.id,
            subject: this.teamIds,
            createAt: null,
            updatedAt: null,
          }).then(response => {delete response.id; return response})
        }
      } catch (e) {
        throw (e)
      }
    })

    it('persists multiple responses for a multi-subject question', async function() {
      try {
        const responseToSave = await this.buildResponse([25, 25, 40, 10])

        await saveResponse(responseToSave)

        const savedResponses = await r.table('responses').run()
        expect(savedResponses).to.have.length(4)
        savedResponses.forEach(response => {
          expect(response).to.have.property('createdAt').and.to.exist
          expect(response).to.have.property('updatedAt').and.to.exist
        })
        expect(savedResponses.map(r => r.value).sort()).to.deep.equal([10, 25, 25, 40])
        expect(savedResponses.map(r => r.subject).sort()).to.deep.equal(this.teamIds.sort())
      } catch (e) {
        throw (e)
      }
    })

    it('updates existing responses when they already exist', async function() {
      try {
        const responseToSave = await this.buildResponse([25, 25, 40, 10])

        await saveResponse(responseToSave)
        await saveResponse(Object.assign({}, responseToSave, {value: [10, 10, 10, 70]}))

        const savedResponses = await r.table('responses').run()
        expect(savedResponses).to.have.length(4)
        expect(savedResponses.map(r => r.value).sort()).to.deep.equal([10, 10, 10, 70])
      } catch (e) {
        throw (e)
      }
    })
  })

})
