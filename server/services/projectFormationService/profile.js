function genProfiler() {
  const profile = {}

  return {
    start: name => {
      profile[name] = profile[name] || {count: 0, elapsed: 0}
      profile[name].start = Date.now()
    },

    pause: name => {
      const now = Date.now()
      profile[name].count++
      profile[name].elapsed += now - profile[name].start
    },

    info: name => {
      profile[name].avg = profile[name].elapsed / profile[name].count
      return profile[name]
    },
  }
}
const profiler = genProfiler()
export default profiler
