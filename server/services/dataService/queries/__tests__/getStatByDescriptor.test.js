/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import getStatByDescriptor from '../getStatByDescriptor'

describe(testContext(__filename), function () {
  withDBCleanup()

  it('returns the correct stat', async function () {
    const statDescriptor = 'myDescriptor'
    const stat = await factory.create('stat', {descriptor: statDescriptor})
    return expect(
      getStatByDescriptor('myDescriptor')
    ).to.eventually.deep.eq(stat)
  })
})
