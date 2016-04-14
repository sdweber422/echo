import React, {Component, PropTypes} from 'react'

import {CardTitle} from 'react-toolbox/lib/card'
import {List, ListItem} from 'react-toolbox'

export default class Home extends Component {
  render() {
    return (
      <div>
        <CardTitle
          avatar="https://brand.learnersguild.org/apple-touch-icon-60x60.png"
          title="Game"
          />
        <List selectable ripple>
          <ListItem
            caption="Chapters"
            leftIcon="view_list"
            onClick={this.props.onListChapters}
            />
          <ListItem
            caption="Explore API"
            leftIcon="flash_on"
            onClick={this.props.onGraphiQL}
            />
          <ListItem
            caption="Sign Out"
            leftIcon="subdirectory_arrow_left"
            onClick={this.props.onSignOut}
            />
        </List>
      </div>
    )
  }
}

Home.propTypes = {
  onListChapters: PropTypes.func.isRequired,
  onGraphiQL: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
}
