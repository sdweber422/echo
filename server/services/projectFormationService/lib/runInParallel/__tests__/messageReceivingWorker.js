export async function handleJob(worker, job) {
  await new Promise(resolve => {
    yieldIfFooOver10(worker, resolve)
  })
}

function yieldIfFooOver10(worker, cb) {
  if (worker.foo > 10) {
    worker.yield('complete')
    cb()
  } else {
    setTimeout(() => yieldIfFooOver10(worker, cb), 100)
  }
}

export function handleMessage(worker, {msgName, data}) {
  if (msgName === 'setFoo') {
    worker.foo = data
  } else {
    worker.log('Unexpected custom message!', msgName, data)
  }
}
