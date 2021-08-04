import concurrency from "../../../../src/helpers/Concurrency";

describe("concurrency", () => {
  test("it create a function", () => {
    const withConcurrency = concurrency();

    expect(typeof withConcurrency).toBe("function");
  });

  test("it should wait for the end of the first mutex", async () => {
    const withConcurrency = concurrency<string>();

    const getCallback = (value: string) => {
      return () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(value);
          }, 200);
        });
      };
    };

    const deferred1 = withConcurrency(getCallback("foo"));
    const deferred2 = withConcurrency(getCallback("bar"));

    jest.clearAllTimers();

    await expect(deferred1).resolves.toBe("foo");
    await expect(deferred2).resolves.toBe("foo");
  });

  test("it should be reset after the end of the first mutex", async () => {
    const withConcurrency = concurrency<string>();

    const getCallback = (value: string) => {
      return () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(value);
          }, 200);
        });
      };
    };

    const deferred1 = await withConcurrency(getCallback("foo"));
    const deferred2 = await withConcurrency(getCallback("bar"));

    jest.clearAllTimers();

    expect(deferred1).toBe("foo");
    expect(deferred2).toBe("bar");
  });
});
