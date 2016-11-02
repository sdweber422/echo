/**
 * Transforms project documents from the structure:
 * {..., cycleHistory: [{cycleId, playerIds, projectReviewSurveyId, retrospectiveSurveyId}]}
 *
 * to the structure:
 * {..., cycleId, playerIds, projectReviewSurveyId, retrospectiveSurveyId}
 */
export async function up(r, conn) {
  const projects = await r.table('projects').run(conn)

  const updates = projects.map(async project => {
    const {cycleHistory} = project
    const primaryCycle = (cycleHistory || [])[0] // all prod projects confirmed to have no more than 1 cycle

    if (primaryCycle) {
      console.log(`Replacing cycle history in ${project.id}`)

      await r.table('projects')
        .get(project.id)
        .update({...primaryCycle})

      return r.table('projects')
        .get(project.id)
        .replace(project => {
          return project.without('cycleHistory')
        })
    }

    console.log(`No cycle history found for project ${project.id}`)
    return null
  })

  return Promise.all(updates)
}

export async function down(r, conn) {
  const projects = await r.table('projects').run(conn)

  const updates = projects.map(async project => {
    const cycleData = {}
    if (project.cycleId) {
      cycleData.cycleId = project.cycleId
    }
    if (project.playerIds) {
      cycleData.playerIds = project.playerIds
    }
    if (project.projectReviewSurveyId) {
      cycleData.projectReviewSurveyId = project.projectReviewSurveyId
    }
    if (project.retrospectiveSurveyId) {
      cycleData.retrospectiveSurveyId = project.retrospectiveSurveyId
    }

    if (Object.keys(cycleData).length > 0) {
      console.log(`Restoring cycle history in ${project.id}`)

      await r.table('projects')
        .get(project.id)
        .update({cycleHistory: [cycleData]})

      return r.table('projects')
        .get(project.id)
        .replace(project => {
          return project.without('cycleId', 'playerIds', 'projectReviewSurveyId', 'retrospectiveSurveyId')
        })
    }

    console.log(`No cycle data found for project ${project.id}`)
    return null
  })

  return Promise.all(updates)
}
