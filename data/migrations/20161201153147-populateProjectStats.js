import Promise from 'bluebird'
import updateProjectStats from 'src/server/actions/updateProjectStats'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'
import {checkForWriteErrors} from 'src/server/services/dataService/util'

export async function up(r, conn) {
  console.log('Reloading Survey And Question Data')
  await reloadSurveyAndQuestionData()
  const projects = await r.table('projects').run(conn)
  console.log(`Adding stats to ${projects.length} projects`)

  await Promise.each(projects, async ({name, id}) => {
    console.log(`Updating Stats For Project ${name} (${id}`)
    await updateProjectStats(id)
  })
}

export async function down(r, conn) {
  await r.table('projects')
   .replace(p => p.without('stats'))
   .run(conn)
   .then(checkForWriteErrors)
}
