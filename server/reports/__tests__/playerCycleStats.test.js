/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions, key-spacing, comma-spacing, no-multi-spaces */
import {addPointInTimeOverallStats} from 'src/server/reports/playerCycleStats'

describe(testContext(__filename), function () {
  describe('addPointInTimeOverallStats()', function () {
    const projectSummaries = [
      {
        project: {
          id: '1e269b41-2fc6-4f79-8302-f21bff8d81f7',
          name: 'lucky-tern',
          cycle: {
            state: 'PRACTICE',
            cycleNumber: 29,
            startTimestamp: '2017-01-23T14:41:22.069Z',
            endTimestamp: null
          },
          goal: {title: 'Core Data Structures', number: 128},
          stats: {projectCompleteness: null, projectHours: null, projectQuality: null}
        },
        userProjectEvaluations: [],
        userProjectStats: {
          challenge:         null, cultureContribution:  null, estimationAccuracy: null,
          estimationBias:    null, experiencePoints:     null, flexibleLeadership: null,
          frictionReduction: null, projectHours:         null, ratingElo:          null,
          receptiveness:     null, relativeContribution: null, resultsFocus:       null,
          teamPlay:          null, technicalHealth:      null
        }
      },
      {
        project: {
          id: '02aeb842-9df3-4144-8d26-43ac1aa9a39e',
          name: 'hollow-sungazer',
          cycle: {
            state: 'COMPLETE',
            cycleNumber: 28,
            startTimestamp: '2017-01-17T17:09:49.947Z',
            endTimestamp: '2017-01-23T14:41:22.041Z'
          },
          goal: {title: 'Simple Book Store', number: 69},
          stats: {projectCompleteness: 80, projectHours: 94, projectQuality: 83.5}
        },
        userProjectEvaluations: [
          {generalFeedback: 'some feedback'},
          {generalFeedback: 'some feedback'},
          {generalFeedback: null}
        ],
        userProjectStats: {
          challenge:         10, cultureContribution:  42,    estimationAccuracy: 98,
          estimationBias:    2 , experiencePoints:     35.72, flexibleLeadership: 75,
          frictionReduction: 67, projectHours:         24,    ratingElo:          989,
          receptiveness:     75, relativeContribution: 38,    resultsFocus:       50,
          teamPlay:          58, technicalHealth:      67
        }
      },
      {
        project: {
          id: '253eace5-e44a-4276-94de-5fedd2576882',
          name: 'clean-racer',
          cycle: {
            state: 'COMPLETE',
            cycleNumber: 27,
            startTimestamp: '2017-01-09T18:50:28.120Z',
            endTimestamp: '2017-01-17T17:09:49.925Z'
          },
          goal: {title: 'To Do List App', number: 64},
          stats: {projectCompleteness: 98, projectHours: 70, projectQuality: 98}
        },
        userProjectEvaluations: [
          {generalFeedback: 'some feedback'},
          {generalFeedback: null}
        ],
        userProjectStats: {
          challenge:         7 , cultureContribution:  83, estimationAccuracy: 100,
          estimationBias:    0 , experiencePoints:     35, flexibleLeadership: 83,
          frictionReduction: 83, projectHours:         32, ratingElo:          979,
          receptiveness:     83, relativeContribution: 50, resultsFocus:       83,
          teamPlay:          83, technicalHealth:      83
        }
      }
    ]

    it('adds point-in-time userOverallStats to each project summary', function () {
      const result = addPointInTimeOverallStats(projectSummaries)

      const firstProjectSummary = result[result.length - 1]
      expect(firstProjectSummary.overallStats).to.deep.eq(firstProjectSummary.userProjectStats)

      expect(result[result.length - 2].overallStats).to.deep.eq({
        challenge:         8.5 , cultureContribution:  62.5 , estimationAccuracy: 99,
        estimationBias:    1   , experiencePoints:     70.72, flexibleLeadership: 79,
        frictionReduction: 75  , projectHours:         24   , ratingElo:          989,
        receptiveness:     79  , relativeContribution: 44   , resultsFocus:       66.5,
        teamPlay:          70.5, technicalHealth:      75
      })
    })
  })
})
