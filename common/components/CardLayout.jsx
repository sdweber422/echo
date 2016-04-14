import React, {Component} from 'react'
import {Card, CardTitle, CardText} from 'react-toolbox/lib/card'

import styles from './CardLayout.css'

export default class NotFound extends Component {
  render() {
    return (
      <Card className={styles.card}>
        <div className={styles.cardContent}>{this.props.children}</div>
      </Card>
    )
  }
}
