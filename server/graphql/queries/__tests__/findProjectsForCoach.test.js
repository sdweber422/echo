/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */
import factory from 'src/test/factories'
import nock from 'nock'
import {flatten} from 'src/common/util'
import {resetDB, runGraphQLQuery, useFixture, expectSetEquality, mockIdmUsersById, mockIdmGetUser} from 'src/test/helpers'
import {Project} from 'src/server/services/dataService'
import saveSurveyResponse from 'src/server/actions/saveSurveyResponse'

import queries from '../index'

const query = `
  query($coachIdentifier: String!) {
    findProjectsForCoach(coachIdentifier: $coachIdentifier) {
      id
      name
      cycle {
        cycleNumber
      }
      state
      goal {
        title
      }
      players {
        handle
      }
      stats {
        projectCompleteness
      }
      coachCompletenessScore
    }
  }
`

describe(testContext(__filename), function () {
  beforeEach(resetDB)

  useFixture.createProjectReviewSurvey()

  beforeEach(async function () {
    nock.cleanAll()
    this.currentUser = await factory.build('user')
    this.coach = await factory.create('player', {id: this.currentUser.id})
    mockIdmGetUser(this.coach.id)
  })

  afterEach(async function () {
    nock.cleanAll()
  })

  it('should return projects with matching coachId', async function () {
    this.coachedProjects = await factory.createMany('project', {coachId: this.coach.id}, 2)
    this.otherProjects = await factory.createMany('project', 3)
    await _mockPlayersInIDMForProjects([...this.coachedProjects, ...this.otherProjects])
    const result = await runGraphQLQuery(
      query,
      queries,
      {coachIdentifier: this.currentUser.id},
      {currentUser: this.currentUser},
    )
    const returnedProjects = result.data.findProjectsForCoach
    const projectIds = this.coachedProjects.map(({id}) => id)
    const returnedProjectIds = returnedProjects.map(({id}) => id)
    expectSetEquality(returnedProjectIds, projectIds)
  })
  it('should return projects with matching coachHandle', async function () {
    this.coachedProjects = await factory.createMany('project', {coachId: this.coach.id}, 2)
    this.otherProjects = await factory.createMany('project', 3)
    await _mockPlayersInIDMForProjects([...this.coachedProjects, ...this.otherProjects])
    const result = await runGraphQLQuery(
      query,
      queries,
      {coachIdentifier: this.currentUser.handle},
      {currentUser: this.currentUser},
    )
    const returnedProjects = result.data.findProjectsForCoach
    const projectIds = this.coachedProjects.map(({id}) => id)
    const returnedProjectIds = returnedProjects.map(({id}) => id)
    expectSetEquality(returnedProjectIds, projectIds)
  })
  it('should return a project with coach\'s completeness score', async function () {
    await this.createProjectReviewSurvey()
    await Project.get(this.project.id).update({coachId: this.currentUser.id})
    await _mockPlayersInIDMForProjects([...this.coachedProjects, ...this.otherProjects])
    saveSurveyResponse({
      respondentId: this.coach.id,
      values: [{subjectId: this.project.id, value: 99}],
      surveyId: this.survey.id,
      questionId: this.survey.questionRefs.find(({name}) => name === 'completeness').questionId
    })
    this.coachedProjects = [...this.coachedProjects, this.project]
    const result = await runGraphQLQuery(
      query,
      queries,
      {coachIdentifier: this.currentUser.id},
      {currentUser: this.currentUser}
    )
    const returnedProject = result.data.findProjectsForCoach[0]
    expect(returnedProject.coachCompletenessScore).to.equal(99)
  })
  it('throws an error if user is not signed-in', function () {
    const result = runGraphQLQuery(query, queries, {coachIdentifier: ''}, {currentUser: null})
    return expect(result).to.eventually.be.rejectedWith(/not authorized/i)
  })
  it('returns no projects when user has not been a coach', async function () {
    this.otherProjects = await factory.createMany('project', 3)
    await _mockPlayersInIDMForProjects([...this.otherProjects])
    const result = await runGraphQLQuery(query, queries, {coachIdentifier: this.currentUser.id}, {currentUser: this.currentUser})
    const returnedProjects = result.data.findProjectsForCoach
    expect(returnedProjects).to.eql([])
  })

  async function _mockPlayersInIDMForProjects(projects) {
    const playerIds = flatten(projects.map(({playerIds}) => playerIds))
    await mockIdmUsersById(playerIds, null, {times: projects.length})
  }
})
