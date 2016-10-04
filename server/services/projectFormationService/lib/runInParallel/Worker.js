import logger from 'src/server/util/logger'

export default class Worker {
  constructor({id, handleJob}) {
    this.id = id
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
    console.log(`${timestamp} worker.${this.id}>`, ...args)
  }

  static start({lib, id}) {
    const handleJob = require(lib)
    const worker = new Worker({id, handleJob})
    worker.start()
  }
}
