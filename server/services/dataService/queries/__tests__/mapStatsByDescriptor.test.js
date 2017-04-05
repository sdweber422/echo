/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {withDBCleanup} from 'src/test/helpers'

import mapStatsByDescriptor from '../mapStatsByDescriptor'

describe(testContext(__filename), function () {
  withDBCleanup()

  it('returns an object mapping descriptors to stats', async function () {
    const stat1 = await factory.create('stat', {descriptor: 'descriptor1'})
    const stat2 = await factory.create('stat', {descriptor: 'descriptor2'})
    expect(await mapStatsByDescriptor()).to.deep.eq({
      descriptor1: stat1,
      descriptor2: stat2,
    })
  })
})
