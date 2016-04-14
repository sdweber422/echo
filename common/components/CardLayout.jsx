import React, {Component, PropTypes} from 'react'
import {Card} from 'react-toolbox/lib/card'

import styles from './CardLayout.css'

export default class CardLayout extends Component {
  render() {
    return (
      <Card className={styles.card}>
        <div className={styles.cardContent}>{this.props.children}</div>
      </Card>
    )
  }
}

CardLayout.propTypes = {
  children: PropTypes.any,
}
