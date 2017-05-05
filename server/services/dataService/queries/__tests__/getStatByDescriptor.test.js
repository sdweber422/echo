/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB} from 'src/test/helpers'

import getStatByDescriptor from '../getStatByDescriptor'

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  it('returns the correct stat', async function () {
    const statDescriptor = 'myDescriptor'
    const stat = await factory.create('stat', {descriptor: statDescriptor})
    const statByDescriptor = await getStatByDescriptor('myDescriptor')
    expect(statByDescriptor.id).to.eq(stat.id)
    expect(statByDescriptor.descriptor).to.eq(statDescriptor)
  })
})
