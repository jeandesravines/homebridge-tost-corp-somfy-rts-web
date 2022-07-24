import concurrency from "."

describe("concurrency", () => {
  test("it create a function", () => {
    const withConcurrency = concurrency()

    expect(typeof withConcurrency).toBe("function")
  })

  test("it should wait for the end of the first mutex", async () => {
    const withConcurrency = concurrency<string>()

    const getCallback = (value: string) => {
      return () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(value)
          }, 200)
        })
      }
    }

    const deferred1 = withConcurrency(getCallback("foo"))
    const deferred2 = withConcurrency(getCallback("bar"))

    jest.clearAllTimers()

    await expect(deferred1).resolves.toBe("foo")
    await expect(deferred2).resolves.toBe("foo")
  })

  test("it should be reset after the end of the first mutex", async () => {
    const withConcurrency = concurrency<string>()

    const getCallback = (value: string) => {
      return () => {
        return new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve(value)
          }, 200)
        })
      }
    }

    const result1 = await withConcurrency(getCallback("foo"))
    const result2 = await withConcurrency(getCallback("bar"))

    jest.clearAllTimers()

    expect(result1).toBe("foo")
    expect(result2).toBe("bar")
  })

  test("it should be reset after a failure", async () => {
    const withConcurrency = concurrency<string>()

    const result1 = await withConcurrency(() => Promise.reject("Failure")).catch((e) => e)
    const result2 = await withConcurrency(() => "Success")

    expect(result1).toBe("Failure")
    expect(result2).toBe("Success")
  })
})
