/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import {getCurrentRetrospectiveSurveyForPlayer} from '../survey'
import {RETROSPECTIVE} from '../../../common/models/cycle'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('getCurrentRetrospectiveSurveyForPlayer()', function () {
    beforeEach(async function () {
      try {
        this.cycle = await factory.create('cycle', {state: RETROSPECTIVE})
        this.players = await factory.createMany('player', {chapterId: this.cycle.chapterId}, 8)
        this.player = this.players[0]
        this.currentUser = await factory.build('user', {id: this.players[0].id})
        this.projects = await Promise.all(Array.from(Array(2).keys()).map(i => {
          return factory.create('project', {
            chapterId: this.cycle.chapterId,
            cycleTeams: {
              [this.cycle.id]: {
                playerIds: this.players.slice(i * 4, i * 4 + 4).map(p => p.id)
              }
            }
          })
        }))
        this.survey = await factory.create('survey', {
          projectId: this.projects[0].id,
          cycleId: this.cycle.id
        })
        this.wrongSurvey = await factory.create('survey', {
          projectId: this.projects[1].id,
          cycleId: this.cycle.id
        })
      } catch (e) {
        throw (e)
      }
    })

    it('returns the correct survey', async function() {
      return expect(
        getCurrentRetrospectiveSurveyForPlayer(this.player.id)
      ).to.eventually.deep.eq(this.survey)
    })
  })
})
