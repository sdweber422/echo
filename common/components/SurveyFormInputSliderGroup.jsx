import React, {PropTypes} from 'react'
import Chip from 'react-toolbox/lib/chip'
import Avatar from 'react-toolbox/lib/avatar'
import Slider from 'react-toolbox/lib/slider'

import {Flex} from './Layout'

import styles from './SurveyFormInputSliderGroup.css'

class SurveyFormInputSliderGroup extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.renderOptionSubject = this.renderOptionSubject.bind(this)
    this.renderOptionSlider = this.renderOptionSlider.bind(this)
    this.renderOptionPercentage = this.renderOptionPercentage.bind(this)
  }

  getSum() {
    return (this.props.value || []).reduce((result, val) => {
      return result + (val.value || 0)
    }, 0)
  }

  getValueForOption(option) {
    const optionValue = (this.props.value || []).find(val => val.key === option.key)
    return optionValue ? optionValue.value : 0
  }

  handleUpdate(key, newValue) {
    if (this.props.onChange) {
      newValue = newValue || 0
      const oldValue = this.getValueForOption({key})
      const oldSum = this.getSum()
      const newSum = oldSum - oldValue + newValue

      if (newSum > this.props.sum) {
        newValue = this.props.sum - oldSum
      }

      const newValues = this.props.options.map(option => {
        return {
          key: option.key,
          value: option.key === key ?
            newValue : this.getValueForOption(option)
        }
      })

      this.props.onChange(this.props.name, newValues)
    }
  }

  renderOptionSubject(option) {
    return (
      <Flex alignItems="center" key={option.key} className={styles.chipContainer}>
        <Chip className={styles.chip}>
          <Flex alignItems="center" height="100%">
            <span className={styles.chipAvatar}>{this.renderOptionSubjectAvatar(option)}</span>
            <span>{option.label}</span>
          </Flex>
        </Chip>
      </Flex>
    )
  }

  renderOptionSubjectAvatar(option) {
    return option.imageUrl ?
      <Avatar><img src={option.imageUrl}/></Avatar> :
      <Avatar icon="person"/>
  }

  renderOptionSlider(option) {
    const sliderProps = {
      step: 1,
      min: 0,
      max: this.props.sum,
      value: this.getValueForOption(option)
    }

    const handleChange = value => this.handleUpdate(option.key, value)

    return (
      <Flex justifyContent="center" alignItems="center" key={option.key} className={styles.sliderContainer}>
        <Slider {...sliderProps} onChange={handleChange} className={styles.slider}/>
      </Flex>
    )
  }

  renderOptionPercentage(option) {
    return (
      <Flex justifyContent="flex-end" alignItems="center" key={option.key} className={styles.percentageContainer}>
        <h5>{`${this.getValueForOption(option)}%`}</h5>
      </Flex>
    )
  }

  render() {
    return (
      <Flex flexDirection="column" width="100%">
        <div>
          <Flex>
            <Flex flexDirection="column" flex={1}>
              {this.props.options.map(this.renderOptionSubject)}
            </Flex>

            <Flex flexDirection="column" flex={9}>
              {this.props.options.map(this.renderOptionSlider)}
            </Flex>

            <Flex flexDirection="column" flex={1}>
              {this.props.options.map(this.renderOptionPercentage)}
            </Flex>
          </Flex>

          <Flex justifyContent="flex-end" className={styles.sumPercentageContainer}>
            <h5 className={styles.sumPercentage}>{`${this.getSum()}%`}</h5>
          </Flex>
        </div>
      </Flex>
    )
  }
}

SurveyFormInputSliderGroup.propTypes = {
  name: PropTypes.string.isRequired,
  sum: PropTypes.number.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.required,
    label: PropTypes.any,
    imageUrl: PropTypes.string,
  })),
  value: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.required,
    value: PropTypes.number
  })),
  onChange: PropTypes.func,
}

export default SurveyFormInputSliderGroup
