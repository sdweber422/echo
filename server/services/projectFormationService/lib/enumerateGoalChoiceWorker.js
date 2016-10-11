import ObjectiveAppraiser from './ObjectiveAppraiser'
import {buildPool} from './pool'
import {getQuickTeamFormationPlan} from './quickTeamFormationPlan'
import enumerateGoalChoices from './enumerateGoalChoices'
import enumeratePlayerAssignmentChoices from './enumeratePlayerAssignmentChoices'
import {teamFormationPlanToString} from './teamFormationPlan'
import {logger} from './util'

let bestFit = {score: 0}
export function handleMessage(worker, {msgName, data}) {
  switch (msgName) {
    case 'newBestFit':
      // console.log(worker.id, 'got new bext fit with score', data.bestFit.score, 'had', bestFit.score)
      if (bestFit.score < data.bestFit.score) {
        bestFit = data.bestFit
      }
      break;
    default: worker.log('Worker Received Unrecognized Message', msgName, data)
  }
}

export async function handleJob(worker, {pool, teamFormationPlan, currentBestFit}) {
  bestFit = currentBestFit
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
    // console.log(`${worker.id} PRUNE? [${prune ? '-' : '+'}]`, context, teamFormationPlanToString(teamFormationPlan), score)
    pruneCalled++
    if (prune) {
      branchesPruned++
    }

    return prune
  }

  for (const teamFormationPlan of enumeratePlayerAssignmentChoices(pool, teamFormationPlan, shouldPrune)) {
    // await new Promise(resolve => {
      const score = appraiser.score(teamFormationPlan)
      logger.trace('Checking Player Assignment Configuration: [', teamFormationPlanToString(teamFormationPlan), ']', score)

      if (bestFit.score < score) {
        bestFit = {...teamFormationPlan, score}
        worker.yield(bestFit)

        logStats('Found New Best Fit [', teamFormationPlanToString(teamFormationPlan), ']')

        if (bestFit.score === 1) {
          return
        }
      }
      teamConfigurationsChcked++
      // resolve()
    // throw 'Die'
    // })
  }
}
