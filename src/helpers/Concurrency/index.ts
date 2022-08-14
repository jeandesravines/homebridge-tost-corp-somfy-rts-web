type Handler<T> = () => T | Promise<T>
type ConcurrencyHandler<T> = (handler: Handler<T>) => Promise<T>

export default function concurrency<T = void>(): ConcurrencyHandler<T> {
  let mutex: Promise<T> | null = null

  return (handler: Handler<T>): Promise<T> => {
    if (!mutex) {
      mutex = Promise.resolve()
        .then(handler)
        .finally(() => {
          mutex = null
        })
    }

    return mutex
  }
}
