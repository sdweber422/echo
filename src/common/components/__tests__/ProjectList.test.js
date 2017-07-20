/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import React from 'react'
import {shallow, mount} from 'enzyme'

import ProjectList from 'src/common/components/ProjectList'
import factory from 'src/test/factories'

describe(testContext(__filename), function () {
  // Variables for text in ProjectList that may change
  const buttonLabel = 'Load More...'
  const noProjectsMessage = 'No projects found.'
  const tableHeaderName = 'Name'
  const tableHeaderCycle = 'Cycle'

  function createProjectList(props) {
    return shallow(React.createElement(ProjectList, props))
  }

  function buildProjectProps(projects, cycle) {
    const projectList = []
    projects.forEach(function (project) {
      const {name} = project
      const {cycleNumber, state} = cycle
      projectList.push({
        cycle: {
          cycleNumber,
          state,
        },
        goal: {
          title: `Phase ${project.goal.phase}`,
        },
        name,
        phase: {
          number: project.goal.phase,
        },
      })
    })
    return projectList
  }

  before(async function () {
    this.cycle = await factory.build('cycle')
    this.projects = await factory.buildMany('project', {cycleId: this.cycle.id, chapterId: this.cycle.chapterId}, 6)
    this.getProps = async function (customProps) {
      const baseProps = {
        allowImport: false,
        allowSelect: true,
        projects: buildProjectProps(this.projects, this.cycle)
      }
      return customProps ? Object.assign({}, baseProps, customProps) : baseProps
    }
  })

  describe('rendering', function () {
    it('should display the provided projects', async function () {
      const props = await this.getProps()
      const root = createProjectList(props)

      expect(root.html()).to.contain(this.projects[0].name)
      expect(root.html()).to.contain(this.cycle.state)
      expect(root.html()).to.contain(buttonLabel)
      expect(root.html()).to.contain('<table')
    })

    it('should display \'No projects found.\' if no projects exist', async function () {
      const props = await this.getProps({projects: []})
      const root = createProjectList(props)

      expect(root.html()).to.contain(noProjectsMessage)
      expect(root.html()).to.not.contain(tableHeaderName).and.to.not.contain(tableHeaderCycle)
      expect(root.html()).to.not.contain(buttonLabel)
      expect(root.html()).to.not.contain('<table')
    })
  })

  describe('interactions', function () {
    it('click \'Load More...\' should call the provided callback function', async function () {
      let clicked = false
      const props = await this.getProps({
        onLoadMoreClicked: () => {
          clicked = true
        }
      })
      const root = mount(React.createElement(ProjectList, props))
      const loadMoreButton = root.findWhere(el => {
        return el.name() === 'button' &&
          el.html().includes(buttonLabel)
      }).first()

      loadMoreButton.simulate('click')

      expect(clicked).to.eq(true)
    })
  })
})
