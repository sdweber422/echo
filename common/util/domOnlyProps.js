// see: https://github.com/erikras/redux-form/issues/1441
const domOnlyProps = ({
  /* eslint-disable no-unused-vars */
  initialValue,
  autofill,
  onUpdate,
  valid,
  invalid,
  dirty,
  pristine,
  active,
  touched,
  visited,
  autofilled,
  /* eslint-enable no-unused-vars */
  ...domProps,
}) => domProps

export default domOnlyProps
