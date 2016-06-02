/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('saveResponses', function () {
    beforeEach(async function () {
      this.question = await factory.create('question')
      this.player = await factory.create('player')
      this.user = await factory.build('user', {id: this.player.id, roles: ['moderator']})
      this.saveResponses = function (value = 'response value') {
        return runGraphQLMutation(
          `mutation($responses: [InputResponse]!) {
            saveResponses(responses: $responses)
            {
              createdIds
            }
          }`,
          fields,
          {
            responses: [{
              value,
              respondentId: this.player.id,
              subject: this.player.id,
              questionId: this.question.id
            }],
          },
          {currentUser: this.user},
        )
      }
    })

    it('records the response', function () {
      return this.saveResponses()
        .then(result => expect(result.data.saveResponses.createdIds).have.length(1))
    })
  })
})
