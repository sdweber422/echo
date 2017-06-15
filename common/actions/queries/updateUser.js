export default function updateUser(values) {
  return {
    variables: {values},
    query: `
      mutation ($values: UserUpdate!) {
        updateUser(values: $values) {
          id
          handle
          updatedAt
        }
      }
    `,
  }
}
