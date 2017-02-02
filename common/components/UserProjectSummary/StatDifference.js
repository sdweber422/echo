import React, {PropTypes} from 'react'
import {roundDecimal} from 'src/common/util'

const StatDifference = props => {
  const {statDiff} = props
  if (!statDiff) {
    return null
  }

  return statDiff > 0 ?
    <strong style={{color: 'green'}}>
      &uarr; {roundDecimal(statDiff)}
    </strong> :
    <strong style={{color: 'red'}}>
      &darr; {roundDecimal(statDiff)}
    </strong>
}

StatDifference.propTypes = {statDiff: PropTypes.number}

export default StatDifference
