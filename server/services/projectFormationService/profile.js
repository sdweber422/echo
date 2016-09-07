const PROFILER_OFF = true

function genProfiler() {
  const profile = {}

  if (PROFILER_OFF) {
    return {
      start: () => {},
      pause: () => {},
      report: () => {},
    }
  }

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

    report: () => {
      Object.keys(profile).forEach(name => {
        profile[name].avg = profile[name].elapsed / profile[name].count
      })
      console.log(JSON.stringify(profile, null, 4))
    },
  }
}
const profiler = genProfiler()
export default profiler
