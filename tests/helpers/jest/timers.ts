export async function jestAdvanceTimersByTime(ms: number) {
  await safeCall(() => {
    jest.advanceTimersByTime(ms)
  })
}

async function safeCall(callback: () => void) {
  await flush()
  callback()
  await flush()
}

async function flush() {
  await new Promise<void>(jest.requireActual("timers").setImmediate)
}
