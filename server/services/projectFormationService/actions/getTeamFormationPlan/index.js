import ObjectiveAppraiser from 'src/server/services/projectFormationService/ObjectiveAppraiser'

import logger from 'src/server/services/projectFormationService/logger'

import {teamFormationPlanToString} from 'src/server/services/projectFormationService/teamFormationPlan'

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
  const logCount = (name, interval, count) => count % interval || logger.debug('>>>>>>>COUNT ', name, count)

  const appraiser = new ObjectiveAppraiser(pool)
  const shouldPrune = (teamFormationPlan, context = '') => {
    logCount('pruneCalled', 10000, pruneCalled++)
    const score = appraiser.score(teamFormationPlan, {teamsAreIncomplete: true})
    const prune = score < bestFit.score
    logger.trace(`PRUNE? [${prune ? '-' : '+'}]`, context, teamFormationPlanToString(teamFormationPlan), score)
    if (prune) {
      branchesPruned++
      logCount('branchesPruned', 10000, branchesPruned)
    }
    return prune
  }

  const rootTeamFormationPlan = {teams: []}
  for (const teamFormationPlan of ennumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune)) {
    logStats('Checking Goal Configuration: [', teamFormationPlanToString(teamFormationPlan), ']')

    for (const teamFormationPlan of ennumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
      const score = appraiser.score(teamFormationPlan)
      logger.debug('Checking Player Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}

        logStats('Found New Best Fit [', teamFormationPlanToString(teamFormationPlan), ']')

        if (bestFit.score === 1) {
          return bestFit.teams
        }
      }
      teamConfigurationsChcked++
    }
    goalConfigurationsChecked++
  }

  if (!bestFit.teams) {
    throw new Error('Unable to find any valid team configuration for this pool')
  }

  return bestFit.teams
}
