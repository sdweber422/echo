import React, {PropTypes} from 'react'
import Input from 'react-toolbox/lib/input'

class SurveyFormInputNumeric extends React.Component {
  constructor(props) {
    super(props)
    this.handleUpdate = this.handleUpdate.bind(this)
  }

  handleUpdate(value) {
    if (this.props.onChange) {
      this.props.onChange(this.props.name, value)
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
