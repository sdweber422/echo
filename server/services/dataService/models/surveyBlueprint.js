export default function surveyBlueprintModel(thinky) {
  const {r, type: {string, date, array}} = thinky

  return {
    name: 'SurveyBlueprint',
    table: 'surveyBlueprints',
    schema: {
      id: string()
        .uuid(4)
        .allowNull(false),

      descriptor: string()
        .allowNull(false),

      defaultQuestionRefs: array()
        .allowNull(false),

      createdAt: date()
        .allowNull(false)
        .default(r.now()),

      updatedAt: date()
        .allowNull(false)
        .default(r.now()),
    },
  }
}
