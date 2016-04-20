import faker from 'faker'

const VALID_TIMEZONES = ['America/Los_Angeles', 'America/Chicago', 'America/New_York']
const now = new Date()

export default function define(factory) {
  factory.define('chapter', null, {
    id: cb => cb(null, faker.random.uuid()),
    name: cb => cb(null, faker.address.city()),
    /* eslint-disable babel/object-shorthand, brace-style */
    channelName: function (cb) { cb(null, faker.helpers.slugify(this.name).toLowerCase()) },
    timezone: cb => cb(null, faker.random.arrayElement(VALID_TIMEZONES)),
    cycleDuration: '1 week',
    cycleEpoch: cb => cb(null, now),
    inviteCodes: [],
    createdAt: cb => cb(null, now),
    updatedAt: cb => cb(null, now),
  })
}
