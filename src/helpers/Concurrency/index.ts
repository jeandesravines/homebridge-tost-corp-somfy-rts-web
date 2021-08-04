type Handler<T = void> = () => T | Promise<T>;
type ConcurrencyHandler<T = void> = (handler: Handler<T>) => Promise<T>;

export default function concurrency<T = void>(): ConcurrencyHandler<T> {
  let mutex: Promise<T> | null = null;

  return (handler: Handler<T>): Promise<T> => {
    if (!mutex) {
      mutex = Promise.resolve()
        .then(() => handler())
        .then((result: T) => {
          return (mutex = null) || result;
        });
    }

    return mutex;
  };
}
