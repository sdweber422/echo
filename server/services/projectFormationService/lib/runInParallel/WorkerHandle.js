import {fork} from 'child_process'
import logger from 'src/server/util/logger'

export default class WorkerHandle {
  constructor(lib, id, jobs, onResult) {
    this.handleResult = onResult
    this.lib = lib
    this.id = id
    this.jobs = jobs
  }

  run() {
    this.proc = fork(`${__dirname}/workerWrapper.js`, [this.lib, this.id], {
      stdio: [0, 1, 2, 'ipc'],
    })

    this.proc.on('message', m => {
      switch (m.WORKER_MSG_TYPE) {
        case 'result': return this.handleResult(m.result, m.workerId)
        case 'ready': return this.handleReady()
        default: logger.error('Parent received unrecognized message', m)
      }
    })

    return this.waitForExit()
  }


  send(msgName, data) {
    this.proc.send({
      WORKER_MSG_TYPE: 'custom',
      msgName,
      data,
    })
  }

  waitForExit() {
    return new Promise((resolve, reject) => {
      this.proc.on('exit', resolve)
    })
  }

  stop() {
    this.proc.kill()
  }

  handleReady() {
    this.log(this.id, 'is ready')
    const {value: job, done: noMoreJobs} = this.jobs.next()

    if (noMoreJobs) {
      this.log('no More Jobs for', this.id)
      return this.stop()
    }

    this.sendJob(job)
  }

  sendJob(job) {
    this.log('sending job to', this.id, job)
    this.proc.send({
      WORKER_MSG_TYPE: 'job',
      job
    })
  }

  log(...msg) {
    const timestamp = process.hrtime().join('.')
    logger.debug(`${timestamp} parent>`, ...msg)
  }
}
