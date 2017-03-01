import React, {PropTypes} from 'react'
import Input from 'react-toolbox/lib/input'

class SurveyFormInputNumeric extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
    this.handleWheel = this.handleWheel.bind(this)
  }

  handleUpdate(value) {
    if (this.props.onChange) {
      this.props.onChange(value)
    }
  }

  handleWheel(event) {
    // see: https://app.clubhouse.io/learnersguild/story/193/disable-scrolling-to-change-value-in-hours-input-field
    if (event) {
      event.preventDefault()
    }
  }

  render() {
    return (
      <section>
        <Input
          type="number"
          name={this.props.name}
          hint={this.props.hint}
          value={this.props.value || ''}
          onChange={this.handleUpdate}
          onWheel={this.handleWheel}
          floating
          />
      </section>
    )
  }
}

SurveyFormInputNumeric.propTypes = {
  name: PropTypes.string.isRequired,
  hint: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
}

export default SurveyFormInputNumeric
