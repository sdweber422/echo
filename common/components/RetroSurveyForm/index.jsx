import React, {PropTypes} from 'react'
import styles from './index.scss'
import RetroSurveyHeader from './RetroSurveyHeader'
import RetroSurveyProgress from './RetroSurveyProgress'
import RetroSurveyBody from './RetroSurveyBody'

export default function RetroSurveyForm(props) {
  const {
    surveyTitle,
    formName,
    surveyFieldGroups,
    surveyGroupIndex,
    surveyFields,
    handleSubmit,
    isBusy,
    submitting,
    invalid,
    onClickSubmit,
    onClickConfirm,
    onClickBack,
    getRef,
  } = props

  return (
    <div className={styles.container} ref={getRef}>
      <RetroSurveyHeader surveyTitle={surveyTitle}/>
      <RetroSurveyProgress surveyFieldGroups={surveyFieldGroups} surveyGroupIndex={surveyGroupIndex}/>
      <RetroSurveyBody
        formName={formName}
        surveyFields={surveyFields}
        handleSubmit={handleSubmit}
        isBusy={isBusy}
        submitting={submitting}
        invalid={invalid}
        surveyGroupIndex={surveyGroupIndex}
        onClickSubmit={onClickSubmit}
        onClickConfirm={onClickConfirm}
        onClickBack={onClickBack}
        />
    </div>
  )
}

RetroSurveyForm.propTypes = {
  surveyTitle: PropTypes.string,
  formName: PropTypes.string,
  surveyFieldGroups: PropTypes.array,
  surveyGroupIndex: PropTypes.number,
  surveyFields: PropTypes.array,
  handleSubmit: PropTypes.func.isRequired,
  isBusy: PropTypes.bool,
  submitting: PropTypes.bool,
  invalid: PropTypes.bool,
  onClickSubmit: PropTypes.func.isRequired,
  onClickConfirm: PropTypes.func.isRequired,
  onClickBack: PropTypes.func.isRequired,
  getRef: PropTypes.func.isRequired,
}
