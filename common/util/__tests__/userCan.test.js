/* eslint-env mocha */
/* global expect */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import userCan from '../userCan'

describe('userCan', function t() {
  it('returns false if user is null or undefined', function t() {
    expect(userCan(null, 'createCycle')).to.not.be.ok
  })

  it('returns false if the user has no roles')
  it('throws if an invalid capability is given')
  it('throws if an invalid capability is given')
  it('returns false if none of the roles for the user have the given capability')
  it('returns true if at least one of the roles for the user has the given capability')
})
