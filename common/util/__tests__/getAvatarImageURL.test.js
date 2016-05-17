/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import getAvatarImageURL from '../getAvatarImageURL'

// TODO: use nock to mock gravatar API
describe(testContext(__filename), function () {
  it('returns false if the user has no email address', function () {
    return expect(getAvatarImageURL({email: null})).to.eventually.not.be.ok
  })

  it('returns false if the user has not uploaded an image to gravatar', async function () {
    const email = 'me.2d8dce5cf45967ad199b77507db3847e@example.com' // ensure that there's no avatar image
    return expect(getAvatarImageURL({email})).to.eventually.not.be.ok
  })

  it('returns true if the user has uploaded an image to gravatar', async function () {
    return expect(getAvatarImageURL({email: 'accounts@learnersguild.org'}))
      .to.eventually.equal('https://www.gravatar.com/avatar/2d8dce5cf45967ad199b77507db3847e')
  })
})
