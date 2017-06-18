import React, {Component, PropTypes} from 'react'
import {Button} from 'react-toolbox/lib/button'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {Flex} from 'src/common/components/Layout'

const ProjectModel = {
  name: {type: String},
  cycleNumber: {title: 'Cycle', type: String},
  state: {title: 'State', type: String},
  goalTitle: {title: 'Goal', type: String},
  memberHandles: {title: 'Members', type: String},
}

export default class ProjectList extends Component {
  render() {
    const {projects, allowSelect, allowImport, onClickImport, onSelectRow} = this.props
    const projectData = projects.map(project => {
      const memberHandles = (project.members || []).map(member => member.handle).join(', ')
      const cycle = project.cycle || {}
      return {
        memberHandles,
        name: project.name,
        state: `${project.state}/${cycle.state}`,
        goalTitle: (project.goal || {}).title,
        cycleNumber: cycle.cycleNumber,
      }
    })
    const header = (
      <ContentHeader
        title="Projects"
        buttonIcon={allowImport ? 'add_circle' : null}
        onClickButton={allowImport ? onClickImport : null}
        />
    )
    const content = projectData.length > 0 ? (
      <ContentTable
        model={ProjectModel}
        source={projectData}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
    ) : (
      <div>No projects found.</div>
    )
    return (
      <Flex column>
        {header}
        {content}
        <Button onClick={this.props.onLoadMoreClicked} label="Load More..." icon="keyboard_arrow_down" accent/>
      </Flex>
    )
  }
}

ProjectList.propTypes = {
  projects: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    state: PropTypes.string,
    goal: PropTypes.shape({
      title: PropTypes.string,
    }),
    cycle: PropTypes.shape({
      cycleNumber: PropTypes.number,
    }),
    members: PropTypes.arrayOf(PropTypes.shape({
      handle: PropTypes.string,
    })),
    createdAt: PropTypes.date,
  })),
  allowSelect: PropTypes.bool,
  allowImport: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onClickImport: PropTypes.func,
  onLoadMoreClicked: PropTypes.func,
}
