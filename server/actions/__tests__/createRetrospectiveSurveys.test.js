/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup, expectSetEquality} from '../../../test/helpers'
import {projectsTable, getTeamPlayerIds, getRetrospectiveSurveyIdForCycle} from '../../../server/db/project'

import createRetrospectiveSurveys from '../createRetrospectiveSurveys'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../../common/models/surveyBlueprint'

describe(testContext(__filename), function () {
  withDBCleanup()

  describe('createRetrospectiveSurveys', function () {
    beforeEach(async function () {
      try {
        this.cycle = await factory.create('cycle')
        this.players = await factory.createMany('player', 8, {chapterId: this.cycle.chapterId})
        this.projects = await Promise.all(Array.from(Array(2).keys()).map(i => {
          return factory.create('project', {
            chapterId: this.cycle.chapterId,
            history: [
              {
                cycleId: this.cycle.id,
                playerIds: this.players.slice(i * 4, i * 4 + 4).map(p => p.id)
              }
            ]
          })
        }))
      } catch (e) {
        throw (e)
      }
    })

    describe('when there is a restrospective surveyBlueprint with questions', function () {
      beforeEach(async function() {
        try {
          this.teamQuestions = await factory.createMany('question', {subjectType: 'team'}, 2)
          this.playerQuestions = await factory.createMany('question', {subjectType: 'player'}, 2)
          this.questions = this.teamQuestions.concat(this.playerQuestions)
          this.surveyBlueprint = await factory.create('surveyBlueprint', {
            descriptor: SURVEY_BLUEPRINT_DESCRIPTORS.retrospective,
            defaultQuestionIds: this.questions.map(q => q.id)
          })
        } catch (e) {
          throw (e)
        }
      })

      it('creates a survey for each project team with all of the default retro questions', async function() {
        try {
          await createRetrospectiveSurveys(this.cycle)

          const surveys = await r.table('surveys').run()
          expect(surveys).to.have.length(this.projects.length)

          const updatedProjects = await projectsTable.getAll(...this.projects.map(p => p.id))
          updatedProjects.forEach(project => {
            const surveyId = getRetrospectiveSurveyIdForCycle(project, this.cycle.id)
            const survey = surveys.find(({id}) => id === surveyId)

            expect(survey).to.exist
            expectSetEquality(
              survey.questionRefs.map(({questionId}) => questionId),
              this.questions.map(({id}) => id),
            )

            const playerIds = getTeamPlayerIds(project, this.cycle.id)
            this.teamQuestions.forEach(question => {
              const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
              expect(refs).to.have.length(1)
              expect(refs[0].subject.sort()).to.deep.eq(playerIds.sort())
            })

            this.playerQuestions.forEach(question => {
              const refs = survey.questionRefs.filter(ref => ref.questionId === question.id)
              expect(refs).to.have.length(playerIds.length)
              expect(refs.map(ref => ref.subject).sort()).to.deep.eq(playerIds.sort())
            })
          })
        } catch (e) {
          throw (e)
        }
      })

      it('fails if called multiple times', function () {
        return expect(
          createRetrospectiveSurveys(this.cycle)
          .then(() => createRetrospectiveSurveys(this.cycle))
        ).to.be.rejected
      })
    })

    describe('when there is no retrospective surveyBlueprint', function () {
      it('rejects the promise', function () {
        return expect(createRetrospectiveSurveys(this.cycle)).to.be.rejected
      })
    })
  })
})
