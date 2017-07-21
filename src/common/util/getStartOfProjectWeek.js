import moment from 'moment'

export default function getStartOfProjectWeek(projects) {
  // Are all projects created at the approximately same time?
  // If they are, there is no reason to repeat calls to moment in the map function
  const cycleCreated = moment(projects[0].createdAt)
  const mondayOfWeekCycleCreated = cycleCreated.clone().startOf('isoweek')
  // I thought this would be a better name than thursdayOfWeekCycleCreated, which was original
  // Another candidate was cycleCreationBoundary
  // I compared the cycleCreated date to the Thursday of the week it was created
  // to see if the cycle was created on Friday or beyond. In that case, the start of
  // week is set to the next Monday. I choose Thursday because there is data that has a
  // cycle being created on a Wednesday, which is plausible, on a shortened week.
  // The cycleCreationCutoff could also be set to Wednesday, in the case that a cycle is started
  // on a Thursday due to holiday. The cutoff could also be noon Wednesday, to account for
  // a two day holiday on either end of the week. This may be the best scenario.
  const cycleCreationCutoff = cycleCreated.clone().day(4)
  const startOfProjectWeek = cycleCreated.isAfter(cycleCreationCutoff) ?
    mondayOfWeekCycleCreated.add(7, 'days').format('MMM D') :
    mondayOfWeekCycleCreated.format('MMM D')

  projects.forEach(project => project.startOfWeek = startOfProjectWeek) // eslint-disable-line no-return-assign

  return projects
}
