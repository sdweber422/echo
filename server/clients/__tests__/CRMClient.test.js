/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import config from 'src/config'
import {
  getContactByEmail,
  notifyContactSignedUp,
} from 'src/server/clients/CRMClient'

const crmBaseUrl = config.server.crm.baseURL
const crmKey = config.server.crm.key

describe(testContext(__filename), function () {
  describe('getContactByEmail()', function () {
    beforeEach(function () {
      this.contact = require('../../../test/helpers/hubSpotContact.json')

      nock(crmBaseUrl)
        .get(`/contacts/v1/contact/email/${encodeURIComponent(this.contact.properties.email.value)}/profile?hapikey=${crmKey}`)
        .reply(200, this.contact)
    })

    it('returns the parsed response on success', function () {
      return expect(getContactByEmail('tanner+test@learnersguild.org'))
        .to.eventually.have.property('vid', this.contact.vid)
    })
  })

  describe('notifyContactSignedUp()', function () {
    beforeEach(function () {
      this.contact = require('../../../test/helpers/hubSpotContact.json')

      nock(crmBaseUrl)
        .get(`/contacts/v1/contact/email/${encodeURIComponent(this.contact.properties.email.value)}/profile?hapikey=${crmKey}`)
        .reply(200, this.contact)
        .post(`/contacts/v1/contact/vid/${this.contact.vid}/profile?hapikey=${crmKey}`)
        .reply(204)
    })

    it('returns true on success', function () {
      return expect(notifyContactSignedUp('tanner+test@learnersguild.org'))
        .to.eventually.equal(true)
    })
  })
})
