import factory from 'src/test/factories'
import {Response} from 'src/server/services/dataService'
import {useFixture} from 'src/test/helpers'

import saveSurveyResponses from '../saveSurveyResponses'
import unlockRetroSurveyForUser from 'src/server/actions/unlockRetroSurveyForUser'

describe.only(testContext(__filename), function () {
  useFixture.buildSurvey()

  beforeEach(async function () {
    await this.buildSurvey()
    const playerId = this.project.playerIds[0]
    this.currentUser = await factory.build('user', {id: playerId})
    this.projectId = await factory.build('project', {id: project.id})
  })

  it('unlocks the survey that is tied to a specific project', async function () {
    const args = {
      responses: [
        {
          respondentId: this.currentUser.id,
          surveyId: this.survey.id,
          projectId: this.project.id,
          values: [{subjectId: this.survey.questionRefs[0].subjectIds[0], value: 'response'}],
        }
      ],
    }
  })
})
