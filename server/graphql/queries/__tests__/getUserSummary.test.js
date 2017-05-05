/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import {resetDB, runGraphQLQuery, useFixture} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'

import fields from '../index'

const query = `
  query($identifier: String!) {
    getUserSummary(identifier: $identifier) {
      user {
        id handle
        chapter { id }
        stats {
          ${STAT_DESCRIPTORS.EXPERIENCE_POINTS}
          ${STAT_DESCRIPTORS.ELO}
        }
      }
      userProjectSummaries {
        project { id name }
        userProjectEvaluations {
          submittedBy { id name handle }
          ${STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION}
          ${STAT_DESCRIPTORS.TECHNICAL_HEALTH}
          ${STAT_DESCRIPTORS.CULTURE_CONTRIBUTION}
        }
        userProjectStats {
          ${STAT_DESCRIPTORS.TEAM_PLAY}
          ${STAT_DESCRIPTORS.TECHNICAL_HEALTH}
        }
      }
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  beforeEach('Create current user', async function () {
    this.currentUser = await factory.build('user', {roles: ['moderator']})
    this.user = await factory.build('user')
  })

  it('returns correct summary for user identifier', async function () {
    useFixture.nockIDMGetUser(this.user)
    const player = await factory.create('player', {id: this.user.id})
    const result = await runGraphQLQuery(
      query,
      fields,
      {identifier: player.id},
      {currentUser: this.currentUser},
    )
    const returned = result.data.getUserSummary
    expect(returned.user.id).to.equal(this.user.id)
    expect(returned.user.handle).to.equal(this.user.handle)
    expect(returned.user.chapter.id).to.equal(player.chapterId)
    expect(returned.user.stats).to.have.property(STAT_DESCRIPTORS.EXPERIENCE_POINTS)
    expect(returned.user.stats).to.have.property(STAT_DESCRIPTORS.ELO)
    expect(returned.userProjectSummaries).to.be.an('array')
  })

  it('throws an error if user is not found', function () {
    useFixture.nockIDMGetUser(this.user)
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: this.currentUser},
    )
    return expect(result).to.eventually.be.rejectedWith(/User not found/i)
  })

  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(
      query,
      fields,
      {identifier: ''},
      {currentUser: null}
    )
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
})
