/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, max-nested-callbacks */

import r from '../../../db/connect'
import factory from '../../../test/factories'
import {withDBCleanup} from '../../../test/helpers'

import createRetrospectiveSurveys from '../createRetrospectiveSurveys'
import {SURVEY_BLUEPRINT_DESCRIPTORS} from '../../../server/db/surveyBlueprint'

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
            cycleTeams: {
              [this.cycle.id]: {
                playerIds: this.players.slice(i * 4, i * 4 + 4).map(p => p.id)
              }
            }
          })
        }))
      } catch (e) {
        throw (e)
      }
    })

    describe('when there is a restrospective surveyBlueprint with questions', function () {
      beforeEach(async function() {
        try {
          this.questions = await factory.createMany('question', {subjectType: 'player'}, 3)
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

          this.projects.forEach(project => {
            const survey = surveys.find(s => s.projectId === project.id)

            expect(survey).to.exist
            expect(survey.questionRefs.map(({questionId}) => questionId).sort())
              .to.deep.eq(this.questions.map(({id}) => id).sort())

            survey.questionRefs.forEach(surveyQ => {
              const playerIds = project.cycleTeams[this.cycle.id].playerIds
              expect(surveyQ.subject.sort()).to.deep.eq(playerIds.sort())
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
