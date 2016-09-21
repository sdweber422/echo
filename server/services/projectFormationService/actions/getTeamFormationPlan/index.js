import ObjectiveAppraiser from 'src/server/services/projectFormationService/ObjectiveAppraiser'
import logger from 'src/server/services/projectFormationService/logger'
import {teamFormationPlanToString} from 'src/server/services/projectFormationService/teamFormationPlan'

import getQuickTeamFormationPlan from './getQuickTeamFormationPlan'
import ennumerateGoalChoices from './ennumerateGoalChoices'
import ennumeratePlayerAssignmentChoices from './ennumeratePlayerAssignmentChoices'

export default function getTeamFormationPlan(pool) {
  let bestFit = {score: 0}
  let goalConfigurationsChecked = 0
  let teamConfigurationsChcked = 0
  let branchesPruned = 0
  let pruneCalled = 0

  const logStats = (...prefix) => {
    logger.log(
      ...prefix,
      'Goal Configurations Checked:', goalConfigurationsChecked,
      'Branches Pruned:', branchesPruned, '/', pruneCalled,
      'Team Configurations Chcked:', teamConfigurationsChcked,
      'Best Fit Score:', bestFit.score,
    )
  }

  const appraiser = new ObjectiveAppraiser(pool)
  const shouldPrune = (teamFormationPlan, context = '') => {
    const score = teamFormationPlan._score || appraiser.score(teamFormationPlan, {teamsAreIncomplete: true})
    const prune = score < bestFit.score

    logger.trace(`PRUNE? [${prune ? '-' : '+'}]`, context, teamFormationPlanToString(teamFormationPlan), score)
    pruneCalled++
    if (prune) {
      branchesPruned++
    }

    return prune
  }

  // Seed "bestFit" with a quick, but decent result
  const baselinePlan = getQuickTeamFormationPlan(pool)
  logStats('Seeding Best Fit With [', teamFormationPlanToString(baselinePlan), ']')
  bestFit = baselinePlan
  bestFit.score = appraiser.score(baselinePlan)

  const rootTeamFormationPlan = {teams: []}
  for (const teamFormationPlan of ennumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune, appraiser)) {
    logStats('Checking Goal Configuration: [', teamFormationPlanToString(teamFormationPlan), ']')

    for (const teamFormationPlan of ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = appraiser.score(teamFormationPlan)
      logger.debug('Checking Player Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}

        logStats('Found New Best Fit [', teamFormationPlanToString(teamFormationPlan), ']')

        if (bestFit.score === 1) {
          return bestFit
        }
      }
      teamConfigurationsChcked++
    }
    goalConfigurationsChecked++
  }

  if (!bestFit.teams) {
    throw new Error(`Unable to find any valid team configuration for this pool: ${JSON.stringify(pool, null, 4)}`)
  }

  logStats('Result [', teamFormationPlanToString(bestFit), ']')

  return bestFit
}
