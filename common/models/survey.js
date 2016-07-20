export const SURVEY_SUBJECT_TYPES = {
  TEAM: 'team',
  PLAYER: 'player', // TODO: should this just be SINGLE?
  SINGLE: 'single',
}

export const SURVEY_RESPONSE_TYPES = {
  TEXT: 'text',
  LIKERT_7: 'likert7Agreement',
  RELATIVE_CONTRIBUTION: 'relativeContribution',
}

export const LIKERT_7_AGREEMENT_OPTIONS = [
  {value: 1, label: 'strongly disagree'},
  {value: 2, label: 'disagree'},
  {value: 3, label: 'somewhat disagree'},
  {value: 4, label: 'neutral'},
  {value: 5, label: 'somewhat agree'},
  {value: 6, label: 'agree'},
  {value: 7, label: 'strongly agree'},
  {value: 0, label: 'not enough information'},
]
