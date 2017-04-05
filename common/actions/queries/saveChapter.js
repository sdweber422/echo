export default function saveChapter(chapter) {
  return {
    variables: {chapter},
    query: `
      mutation ($chapter: InputChapter!) {
        saveChapter(chapter: $chapter) {
          id
          name
          channelName
          timezone
          inviteCodes
        }
      }
    `,
  }
}
