type Handler = () => void | Promise<void>;
type ConcurrencyHandler = (handler: Handler) => Promise<void>;

export default function concurrency(): ConcurrencyHandler {
  let mutex: Promise<void> | null = null;

  return (handler: Handler): Promise<void> => {
    if (!mutex) {
      mutex = Promise.resolve()
        .then(() => handler())
        .then(() => {
          mutex = null;
        });
    }

    return mutex;
  };
}
