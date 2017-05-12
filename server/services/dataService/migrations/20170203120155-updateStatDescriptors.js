const shortToLongMappings = {
  abc: 'relativeContributionAggregateCycles',
  cc: 'cultureContribution',
  ec: 'effectiveContribution',
  ecc: 'relativeContributionEffectiveCycles',
  ecd: 'effectiveContributionDelta',
  hours: 'projectHours',
  rc: 'relativeContribution',
  th: 'technicalHealth',
  tp: 'teamPlay',
  xp: 'experiencePoints',
}
const longToShortMappings = Object.keys(shortToLongMappings)
  .reduce((result, desc) => {
    result[shortToLongMappings[desc]] = desc
    return result
  }, {})
const renameUpMappings = {
  receptiveness: 'teamPlayReceptiveness',
  resultsFocus: 'teamPlayResultsFocus',
  flexibleLeadership: 'teamPlayFlexibleLeadership',
  frictionReduction: 'teamPlayFrictionReduction',
}
const renameDownMappings = Object.keys(renameUpMappings)
  .reduce((result, desc) => {
    result[renameUpMappings[desc]] = desc
    return result
  }, {})

export function up(r, conn) {
  const upPromises = Object.keys(renameUpMappings).map(
    descriptor => r.table('stats')
      .filter({descriptor})
      .update({descriptor: renameUpMappings[descriptor]})
      .run(conn)
  )
  upPromises.push(r.table('stats').replace(stat => stat.without('shortName')).run(conn))

  return Promise.all(upPromises)
}

export function down(r, conn) {
  const downDescriptorPromises = Object.keys(renameDownMappings).map(
    descriptor => r.table('stats')
      .filter({descriptor})
      .update({descriptor: renameDownMappings[descriptor]})
      .run(conn)
  )

  const downShortNamePromises = Object.keys(longToShortMappings).map(
    descriptor => r.table('stats')
      .filter({descriptor})
      .update({shortName: longToShortMappings[descriptor]})
      .run(conn)
  )

  return Promise.all(downDescriptorPromises.concat(downShortNamePromises))
}
