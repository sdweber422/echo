/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import {getAssignedPlayerIds} from 'src/server/services/projectFormationService/teamFormationPlan'
import {buildTestPool} from 'src/server/services/projectFormationService/__tests__/testHelpers'

import getQuickTeamFormationPlan from '../getQuickTeamFormationPlan'

describe(testContext(__filename), function () {
  it('builds suboptimal teamFormationPlan quickly', function () {
    const pool = buildTestPool({advancedPlayerCount: 10, playerCount: 32, teamSize: 4, goalCount: 10})
    const teamFormationPlan = getQuickTeamFormationPlan(pool)

    expect(teamFormationPlan.teams).to.have.length(11)

    teamFormationPlan.teams.forEach(team => {
      expect(team.goalDescriptor, 'all teams have the same goal').to.eq(teamFormationPlan.teams[0].goalDescriptor)
    })

    expect(getAssignedPlayerIds(teamFormationPlan)).to.have.length(42)
  })
})
