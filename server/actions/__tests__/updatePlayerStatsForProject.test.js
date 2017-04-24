/* eslint-env mocha */

/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
/* eslint key-spacing: [2, { "mode": "minimum" }] */
import factory from 'src/test/factories'
import {withDBCleanup, useFixture, mockIdmUsersById} from 'src/test/helpers'
import {STAT_DESCRIPTORS} from 'src/common/models/stat'
import {PROJECT_DEFAULT_EXPECTED_HOURS, PROJECT_STATES} from 'src/common/models/project'
import reloadSurveyAndQuestionData from 'src/server/actions/reloadSurveyAndQuestionData'
import {Player, Survey, findQuestionsByStat} from 'src/server/services/dataService'

import updatePlayerStatsForProject from '../updatePlayerStatsForProject'

const {
  CHALLENGE,
  CULTURE_CONTRIBUTION,
  ELO,
  ESTIMATION_ACCURACY,
  ESTIMATION_BIAS,
  EXPERIENCE_POINTS,
  EXPERIENCE_POINTS_V2,
  LEVEL,
  PROJECT_COMPLETENESS,
  RAW_PROJECT_COMPLETENESS,
  PROJECT_HOURS,
  PROJECT_TIME_OFF_HOURS,
  RELATIVE_CONTRIBUTION,
  RELATIVE_CONTRIBUTION_RAW,
  RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES,
  RELATIVE_CONTRIBUTION_DELTA,
  RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES,
  RELATIVE_CONTRIBUTION_EXPECTED,
  RELATIVE_CONTRIBUTION_HOURLY,
  RELATIVE_CONTRIBUTION_OTHER,
  RELATIVE_CONTRIBUTION_SELF,
  TEAM_HOURS,
  TEAM_PLAY,
  TECHNICAL_HEALTH,
} = STAT_DESCRIPTORS

describe(testContext(__filename), function () {
  describe('updatePlayerStatsForProject', function () {
    withDBCleanup()
    this.timeout(8000)
    useFixture.buildSurvey()

    describe('when there are multiple players on a project', function () {
      beforeEach('Setup Survey Data (multi-player)', async function () {
        useFixture.nockClean()
        await reloadSurveyAndQuestionData()

        this.setupSurveyData = async customResponses => {
          const {playerResponses, projectResponses} = await _getQuestionsAndReponsesMP(customResponses)
          const project = await factory.create('project', {
            stats: {
              [PROJECT_COMPLETENESS]: 100,
              [RAW_PROJECT_COMPLETENESS]: 100,
            },
            state: PROJECT_STATES.CLOSED,
          })

          await this.buildSurvey({
            type: 'retrospective',
            questionRefs: [
              ...playerResponses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.playerIds})),
              ...projectResponses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.id})),
            ],
            project
          })

          const responseData = []
          this.project.playerIds.forEach((respondentId, respondentNum) => {
            this.project.playerIds.forEach((subjectId, subjectNum) => {
              playerResponses.forEach(qr => {
                responseData.push({
                  questionId: qr.questionId,
                  surveyId: this.survey.id,
                  respondentId,
                  subjectId,
                  value: qr.value ? qr.value : qr.values[subjectNum],
                })
              })
            })

            projectResponses.forEach(qr => {
              responseData.push({
                questionId: qr.questionId,
                surveyId: this.survey.id,
                respondentId,
                subjectId: this.project.id,
                value: qr.value ? qr.value : qr.values[respondentNum],
              })
            })

            this.survey.completedBy.push(respondentId)
          })

          await Survey.save(this.survey, {conflict: 'replace'})
          await factory.createMany('response', responseData)
        }
      })

      it('updates the players\' stats based on the survey responses', async function () {
        await this.setupSurveyData()
        const playerId = this.project.playerIds[0]

        await mockIdmUsersById(this.project.playerIds)
        await Player.get(playerId).update({stats: {[ELO]: {rating: 1300}}})
        await updatePlayerStatsForProject(this.project)
        const updatedPlayer = await Player.get(playerId)

        expect(updatedPlayer.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(100)
        expect(updatedPlayer.stats[EXPERIENCE_POINTS]).to.eq(35)
        expect(updatedPlayer.stats[EXPERIENCE_POINTS_V2]).to.eq(40)
        expect(updatedPlayer.stats[ELO].rating).to.eq(1279)
        expect(updatedPlayer.stats[ELO].matches).to.eq(3)
        expect(updatedPlayer.stats.projects).to.deep.eq({
          [this.project.id]: {
            [CHALLENGE]: 7,
            [TECHNICAL_HEALTH]: 83,
            [CULTURE_CONTRIBUTION]: 67,
            [TEAM_PLAY]: 83,
            [RELATIVE_CONTRIBUTION_EXPECTED]: 25,
            [RELATIVE_CONTRIBUTION_DELTA]: 0,
            [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 4,
            [RELATIVE_CONTRIBUTION]: 25,
            [RELATIVE_CONTRIBUTION_RAW]: 25,
            [RELATIVE_CONTRIBUTION_SELF]: 25,
            [RELATIVE_CONTRIBUTION_OTHER]: 25,
            [RELATIVE_CONTRIBUTION_HOURLY]: 0.71,
            [ESTIMATION_BIAS]: 0,
            [ESTIMATION_ACCURACY]: 100,
            [PROJECT_HOURS]: 35,
            [TEAM_HOURS]: 140,
            [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 100,
            [EXPERIENCE_POINTS]: 35,
            [EXPERIENCE_POINTS_V2]: 40,
            [ELO]: {
              rating: 1279,
              matches: 3,
              score: 0.71,
              kFactor: 20,
            },
            [LEVEL]: {
              ending: 0,
              starting: 0,
            },
          },
        })
      })

      it('does not compute Elo for coaches', async function () {
        await this.setupSurveyData()

        const playerInfoOverrides = this.project.playerIds.map((id, i) => ({
          id,
          roles: i === 0 ? ['coach', 'player'] : ['player'],
        }))
        await mockIdmUsersById(this.project.playerIds, playerInfoOverrides)

        const [coachPlayerId, regularPlayerId] = this.project.playerIds
        await Player.get(coachPlayerId).replace(row => row.without('stats'))

        await updatePlayerStatsForProject(this.project)

        const updatedCoachPlayer = await Player.get(coachPlayerId)
        const updatedRegularPlayer = await Player.get(regularPlayerId)

        expect(updatedCoachPlayer.stats).to.not.have.property(ELO)
        expect(updatedCoachPlayer.stats.projects[this.project.id]).to.not.have.property(ELO)

        expect(updatedRegularPlayer.stats).to.have.deep.property('elo.rating')
        expect(updatedRegularPlayer.stats.projects[this.project.id]).to.have.deep.property('elo.rating')
      })

      it('ignores players who have reported "time off hours" >= "expected hours" in the project', async function () {
        await this.setupSurveyData({
          [STAT_DESCRIPTORS.RELATIVE_CONTRIBUTION]: [35, 25, 25, 15],
          [STAT_DESCRIPTORS.PROJECT_TIME_OFF_HOURS]: [3, 3, 3, PROJECT_DEFAULT_EXPECTED_HOURS + 2],
        })

        const activePlayerId = this.project.playerIds[0]
        const inactivePlayerId = this.project.playerIds[3]
        const initialInactivePlayer = await Player.get(inactivePlayerId)
        await mockIdmUsersById(this.project.playerIds)

        await Player.get(activePlayerId).update({stats: {[ELO]: {rating: 1300}}})
        await updatePlayerStatsForProject(this.project)
        const updatedActivePlayer = await Player.get(activePlayerId)
        const updatedInactivePlayer = await Player.get(inactivePlayerId)

        // the stats for the inactive player shouldn't change
        expect(initialInactivePlayer.stats).to.deep.eq(updatedInactivePlayer.stats)

        // the stats for the active player should be such that the inactive player
        // was ignored
        expect(updatedActivePlayer.stats[RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]).to.eq(123)
        expect(updatedActivePlayer.stats[EXPERIENCE_POINTS]).to.eq(43.05)
        expect(updatedActivePlayer.stats[EXPERIENCE_POINTS_V2]).to.eq(56)
        expect(updatedActivePlayer.stats[LEVEL]).to.eq(0)
        expect(updatedActivePlayer.stats[ELO].rating).to.eq(1296)
        expect(updatedActivePlayer.stats[ELO].matches).to.eq(2)
        expect(updatedActivePlayer.stats.projects).to.deep.eq({
          [this.project.id]: {
            [CHALLENGE]: 7,
            [TECHNICAL_HEALTH]: 83,
            [CULTURE_CONTRIBUTION]: 67,
            [TEAM_PLAY]: 83,
            [RELATIVE_CONTRIBUTION_EXPECTED]: 33,
            [RELATIVE_CONTRIBUTION_DELTA]: 8,
            [RELATIVE_CONTRIBUTION_AGGREGATE_CYCLES]: 3,
            [RELATIVE_CONTRIBUTION]: 41,
            [RELATIVE_CONTRIBUTION_RAW]: 41,
            [RELATIVE_CONTRIBUTION_SELF]: 41,
            [RELATIVE_CONTRIBUTION_OTHER]: 41,
            [RELATIVE_CONTRIBUTION_HOURLY]: 1.17,
            [ESTIMATION_BIAS]: 0,
            [ESTIMATION_ACCURACY]: 100,
            [PROJECT_HOURS]: 35,
            [TEAM_HOURS]: 105,
            [RELATIVE_CONTRIBUTION_EFFECTIVE_CYCLES]: 123,
            [EXPERIENCE_POINTS]: 43.05,
            [EXPERIENCE_POINTS_V2]: 56,
            [ELO]: {
              rating: 1296,
              matches: 2,
              score: 1.17,
              kFactor: 20,
            },
            [LEVEL]: {
              ending: 0,
              starting: 0,
            },
          },
        })
      })

      it('does not update the player\'s stats if the retrospective is still open', async function () {
        await this.setupSurveyData()
        const [firstPlayerId] = this.project.playerIds

        this.survey.completedBy = []
        await Survey.save(this.survey, {conflict: 'replace'})

        await mockIdmUsersById(this.project.playerIds)
        await updatePlayerStatsForProject(this.project)
        const firstUpdatedPlayer = await Player.get(firstPlayerId)

        expect(firstUpdatedPlayer.stats.projects).to.be.undefined
      })
    })

    describe('when there is a single player on a project', function () {
      beforeEach('Setup Survey Data (single player)', async function () {
        useFixture.nockClean()
        await reloadSurveyAndQuestionData()

        this.setupSurveyData = async customResponses => {
          const responses = await _getQuestionsAndResponsesSP(customResponses)

          await this.buildSurvey({
            type: 'retrospective',
            questionRefs: responses.map(q => ({questionId: q.questionId, subjectIds: () => this.project.id})),
            project: await factory.create('single player project', {
              stats: {
                [PROJECT_COMPLETENESS]: 100,
                [RAW_PROJECT_COMPLETENESS]: 100,
              },
              state: PROJECT_STATES.CLOSED,
            })
          })

          const responseData = []
          this.project.playerIds.forEach((respondentId, respondentNum) => {
            responses.forEach(qr => {
              responseData.push({
                questionId: qr.questionId,
                surveyId: this.survey.id,
                respondentId,
                subjectId: this.project.id,
                value: qr.value ? qr.value : qr.values[respondentNum],
              })
            })

            this.survey.completedBy.push(respondentId)
          })

          await Survey.save(this.survey, {conflict: 'replace'})
          await factory.createMany('response', responseData)
        }
      })

      it('updates the player\'s stats based on the survey responses', async function () {
        await this.setupSurveyData()

        const [playerId] = this.project.playerIds
        await mockIdmUsersById(this.project.playerIds)

        // create a shell project with this user and give it a fake stats history
        // to hack in sufficient data for a useful weightedAverages outcome
        const fakeCompletedProject = await factory.create('project', {playerIds: [playerId]})

        const player = await Player.get(playerId).update({
          stats: {
            [LEVEL]: 1,
            [EXPERIENCE_POINTS]: 100,
            [EXPERIENCE_POINTS_V2]: 100,
            [ELO]: {
              rating: 900,
              matches: 4,
            },
            projects: {
              [fakeCompletedProject.id]: {
                [EXPERIENCE_POINTS]: 100,
                [EXPERIENCE_POINTS_V2]: 100,
                [ESTIMATION_ACCURACY]: 99,
              },
            },
            weightedAverages: {
              [EXPERIENCE_POINTS]: 100,
              [EXPERIENCE_POINTS_V2]: 100,
              [ESTIMATION_ACCURACY]: 99,
            },
          },
        })

        await updatePlayerStatsForProject(this.project)
        const updatedPlayer = await Player.get(playerId)

        expect(updatedPlayer.stats[EXPERIENCE_POINTS]).to.eq(player.stats[EXPERIENCE_POINTS] + 35)
        expect(updatedPlayer.stats[EXPERIENCE_POINTS_V2]).to.eq(player.stats[EXPERIENCE_POINTS_V2] + 115)
        expect(updatedPlayer.stats[ELO].rating).to.eq(player.stats[ELO].rating)
        expect(updatedPlayer.stats[ELO].matches).to.eq(player.stats[ELO].matches)
        expect(updatedPlayer.stats[LEVEL]).to.eq(player.stats[LEVEL])
        expect(updatedPlayer.stats.projects[this.project.id]).to.deep.eq({
          [CHALLENGE]: 7,
          [PROJECT_HOURS]: 35,
          [TEAM_HOURS]: 35,
          [EXPERIENCE_POINTS]: 35,
          [EXPERIENCE_POINTS_V2]: 115,
          [LEVEL]: {
            ending: 1,
            starting: 1,
          },
        })
      })
    })
  })
})

const _getQId = descriptor => findQuestionsByStat(descriptor).filter({active: true})(0)('id')
const _qAndR = async (descriptor, responses) => {
  const val = responses[descriptor]
  const qr = {questionId: await _getQId(descriptor)}
  if (Array.isArray(val)) {
    qr.values = val
  } else {
    qr.value = val
  }
  return qr
}

async function _getQuestionsAndReponsesMP(customResponses = {}) {
  const playerDescriptors = [
    TECHNICAL_HEALTH,
    CULTURE_CONTRIBUTION,
    TEAM_PLAY,
    RELATIVE_CONTRIBUTION,
  ]
  const projectDescriptors = [
    PROJECT_TIME_OFF_HOURS,
    CHALLENGE,
  ]

  const defaultResponses = {
    [TECHNICAL_HEALTH]: 6,
    [CULTURE_CONTRIBUTION]: 5,
    [TEAM_PLAY]: 6,
    [RELATIVE_CONTRIBUTION]: 20,
    [PROJECT_TIME_OFF_HOURS]: 3,
    [CHALLENGE]: 7,
  }
  const mergedResponses = {...defaultResponses, ...customResponses}

  const playerResponses = await Promise.all(playerDescriptors.map(async desc => await _qAndR(desc, mergedResponses)))
  const projectResponses = await Promise.all(projectDescriptors.map(async desc => await _qAndR(desc, mergedResponses)))

  return {playerResponses, projectResponses}
}

async function _getQuestionsAndResponsesSP(customResponses = {}) {
  const descriptors = [
    PROJECT_TIME_OFF_HOURS,
    CHALLENGE,
  ]
  const defaultResponses = {
    [PROJECT_TIME_OFF_HOURS]: 3,
    [CHALLENGE]: 7,
  }
  const mergedResponses = {...defaultResponses, ...customResponses}

  return await Promise.all(descriptors.map(async desc => await _qAndR(desc, mergedResponses)))
}
