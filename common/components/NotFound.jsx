import React, {Component} from 'react'
import {Card, CardTitle, CardText} from 'react-toolbox/lib/card'

import styles from './NotFound.scss'

export default class NotFound extends Component {
  render() {
    return (
      <Card className={styles.card}>
        <CardTitle
          avatar="https://brand.learnersguild.org/apple-touch-icon-60x60.png"
          title="Not Found"
          />
        <CardText className={styles.cardContent}>The requested url was not found.</CardText>
      </Card>
    )
  }
}
