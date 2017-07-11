import React, {Component, PropTypes} from 'react'
import Helmet from 'react-helmet'
import {Tab, Tabs} from 'react-toolbox'

import ContentHeader from 'src/common/components/ContentHeader'
import ContentTable from 'src/common/components/ContentTable'
import {Flex} from 'src/common/components/Layout'

export default class TabbedContentTable extends Component {
  render() {
    const {
      model,
      source,
      allowSelect,
      allowImport,
      onClickImport,
      onSelectRow,
      selectedTabIndex,
      tabs,
      title
    } = this.props

    const header = (
      <ContentHeader
        title={title}
        buttonIcon={allowImport ? 'add_circle' : null}
        onClickButton={allowImport ? onClickImport : null}
        />
    )

    const table = (
      <ContentTable
        model={model}
        source={source}
        allowSelect={allowSelect}
        onSelectRow={allowSelect ? onSelectRow : null}
        />
    )

    const tabDisplay = tabs.map((tab, index) => {
      return <Tab label={tab} key={index}><small>{table}</small></Tab>
    })

    const tabContent = (
      <Tabs onChange={this.props.onSelectTab} index={selectedTabIndex} fixed>
        {tabDisplay}
      </Tabs>
    )

    return (
      <Flex column>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        {header}
        {tabContent}
      </Flex>
    )
  }
}

TabbedContentTable.propTypes = {

  title: PropTypes.string.isRequired,
  model: PropTypes.object.isRequired,
  source: PropTypes.array.isRequired,
  tabs: PropTypes.array.isRequired,
  selectedTabIndex: PropTypes.number.isRequired,
  allowSelect: PropTypes.bool,
  allowImport: PropTypes.bool,
  onSelectRow: PropTypes.func,
  onClickImport: PropTypes.func,
  onLoadMoreClicked: PropTypes.func,
  onSelectTab: PropTypes.func
}
