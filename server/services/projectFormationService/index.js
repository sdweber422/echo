import ObjectiveAppraiser from './lib/ObjectiveAppraiser'
import {buildPool} from './lib/pool'
import {getQuickTeamFormationPlan} from './lib/quickTeamFormationPlan'
import enumerateGoalChoices from './lib/enumerateGoalChoices'
import enumeratePlayerAssignmentChoices from './lib/enumeratePlayerAssignmentChoices'
import {teamFormationPlanToString} from './lib/teamFormationPlan'
import {logger, range} from './lib/util'
import WorkerHandle from './lib/runInParallel/WorkerHandle'

async function enumeratePlayerAssignmentChoicesInParallel(pool, goalChoices, currentBestFit) {
  const handles = []
  const onResult = newBestFit => {
    currentBestFit = newBestFit
    // console.log('newBestFit', teamFormationPlanToString(currentBestFit), currentBestFit.score)
    if (currentBestFit.score === 1) {
      handles.forEach(handle => {
        handle.stop()
      })
    } else {
      handles.forEach(handle => {
        handle.send('newBestFit', {bestFit: newBestFit})
      })
    }
  }
  const workerLib = `${__dirname}/lib/enumerateGoalChoiceWorker.js`
  const jobs = (function *() {
    for (const teamFormationPlan of goalChoices) {
      yield {pool, teamFormationPlan, currentBestFit}
    }
  })()
  handles.push(...range(0, 5)
    .map(i => new WorkerHandle(workerLib, i, jobs, onResult)))

  return Promise.all(
    handles.map(_ => _.run())
  ).then(() => currentBestFit)
}

export async function getTeamFormationPlan(poolAttributes) {
  const pool = buildPool(poolAttributes)
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
  const goalChoices = enumerateGoalChoices(pool, rootTeamFormationPlan, shouldPrune, appraiser)
  bestFit = await enumeratePlayerAssignmentChoicesInParallel(pool, goalChoices, bestFit)

  if (!bestFit || bestFit.score === 0) {
    throw new Error(`Unable to find any valid team configuration for this pool: ${JSON.stringify(pool, null, 4)}`)
  }

  logStats('Result [', teamFormationPlanToString(bestFit), ']')
  logger.log('Score Breakdown:', appraiser.objectiveScores(bestFit).map(({score, objective}) => `${objective}=${score}`).join(', '))

  return bestFit
}
