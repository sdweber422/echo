/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import fields from '../mutation'
import r from '../../../../../db/connect'
import factory from '../../../../../test/factories'
import {withDBCleanup, runGraphQLMutation} from '../../../../../test/helpers'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe.skip('saveResponse', function () {
    beforeEach(async function () {
      this.question = await factory.create('question')
      this.player = await factory.create('player')
      this.user = await factory.build('user', {id: this.player.id, roles: ['moderator']})
      this.saveResponse = function (value='response value') {
        return runGraphQLMutation(
          `mutation(
            $value: String!
            $respondantId: ID!
            $subject: ID!
            $questionId: ID!
            ) {
            saveResponse(response: {
              value: $value
              respondantId: $respondantId,
              subject: $subject,
              questionId: $questionId
            }) {
              value
            }
          }`,
          fields,
          {
            value,
            respondantId: this.player.id,
            subject: this.player.id,
            questionId: this.question.id
          } ,
          {currentUser: this.user},
        )
      }
    })

    it('records the response', function () {
      return this.saveResponse()
        .then(result => expect(result.data.saveResponse).have.property('value'))
    })
  })
})
