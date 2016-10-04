import logger from 'src/server/util/logger'

export default class Worker {
  constructor({id, handleJob, handleMessage}) {
    this.id = id
    this.handleCustomMessage = m => handleMessage(this, m)
    this.handleJob = job => handleJob(this, job)
  }

  start() {
    this.log('registering message handlers')
    process.on('message', m => {
      switch (m.WORKER_MSG_TYPE) {
        case 'job':
          this.log('got job', m)
          this.handleJob(m.job)
            .then(() => this.ready())
          break;
        case 'custom': return this.handleCustomMessage(m)
        default: logger.error('Child received unrecognized message', m)
      }
    })

    this.ready()
  }

  ready() {
    this.log('ready for more work')
    process.send({WORKER_MSG_TYPE: 'ready'})
  }

  yield(result) {
    this.log('yield', result, 'from', this.id)
    process.send({
      WORKER_MSG_TYPE: 'result',
      workerId: this.id,
      result,
    })
  }

  log(...args) {
    const timestamp = process.hrtime().join('.')
    logger.debug(`${timestamp} worker.${this.id}>`, ...args)
  }

  static start({lib, id}) {
    const {handleJob, handleMessage} = require(lib)
    const worker = new Worker({id, handleJob, handleMessage})
    worker.start()
  }
}
