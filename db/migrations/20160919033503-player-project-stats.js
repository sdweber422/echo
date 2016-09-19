require('src/db/config')()

exports.up = async (r, conn) => {
  const players = await r.table('players').run(conn)

  const updates = players.map(player => {
    const {stats = {}} = player
    const {projects = {}} = stats

    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId]
      const cycleId = Object.keys(project.cycles)[0]
      const cycleStats = project.cycles[cycleId]

      if (cycleStats) {
        // select one cycle in project (all projects have only 1)
        // move values in cycle-specific hash to top-level project stats object
        Object.assign(project, cycleStats)
      }
    })

    return r.table('players')
      .get(player.id)
      .replace({stats})
  })

  return Promise.all(updates)
}
