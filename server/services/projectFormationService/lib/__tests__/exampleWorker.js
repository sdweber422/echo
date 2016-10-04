export default async function handleJob(worker, job) {
  const num = job
  for (let i = 1; i <= num; i++) {
    await new Promise((resolve, reject) => {
      try {
        worker.log('gonna yield', num*i)
        worker.yield(num * i)
        resolve()
      } catch (e) {
        worker.log(e)
        reject(e)
      }
    })
  }
}
