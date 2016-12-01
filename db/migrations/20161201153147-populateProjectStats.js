import Promise from 'bluebird'
import {findProjects} from 'src/server/db/project'
import {checkForWriteErrors} from 'src/server/db/util'
import updateProjectStats from 'src/server/actions/updateProjectStats'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'

export async function up() {
  console.log('Reloading Survey And Question Data')
  await reloadSurveyAndQuestionData()
  const projects = await findProjects()
  console.log(`Adding stats to ${projects.length} projects`)

  await Promise.each(projects, async ({name, id}) => {
    console.log(`Updating Stats For Project ${name} (${id}`)
    await updateProjectStats(id)
  })
}

export async function down() {
  await findProjects()
   .replace(p => p.without('stats'))
   .then(checkForWriteErrors)
}

