import * as configuration from "../../../../src/configuration"
import ApiClient from "../../../../src/services/ApiClient"

function createApiClient() {
  return new ApiClient({ id: "DEVICE_ID" })
}

describe("request", () => {
  test("it should use Device ID", async () => {
    const client = createApiClient()
    const response = { json: async () => ({ data: "ok" }) } as Response
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(response)

    const result = await client["request"]({
      path: "http://localhost",
      method: "GET",
      data: { foo: "bar" },
    })

    expect(mockFetch).toHaveBeenCalledWith("http://localhost?foo=bar", {
      method: "GET",
      headers: {
        Cookie: `cookie-consent=1; device_id=DEVICE_ID`,
      },
    })

    expect(result).toEqual(response)
  })

  test("it should use Session ID", async () => {
    const client = createApiClient()
    const response = { json: async () => ({ data: "ok" }) } as Response
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(response)

    client["sessionId"] = "SESSION_ID"

    const result = await client["request"]({
      path: "http://localhost",
      method: "GET",
      data: { foo: "bar" },
    })

    expect(mockFetch).toHaveBeenCalledWith("http://localhost?foo=bar", {
      method: "GET",
      headers: {
        Cookie: `cookie-consent=1; device_id=DEVICE_ID; PHPSESSID=SESSION_ID`,
      },
    })

    expect(result).toEqual(response)
  })

  test("it should send as x-www-form-urlencoded", async () => {
    const client = createApiClient()
    const response = { json: async () => ({ data: "ok" }) } as Response
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue(response)

    client["sessionId"] = "SESSION_ID"

    const result = await client["request"]({
      path: "http://localhost",
      method: "POST",
      data: { foo: "bar" },
    })

    expect(mockFetch).toHaveBeenCalledWith("http://localhost", {
      method: "POST",
      body: "foo=bar",
      headers: {
        Cookie: `cookie-consent=1; device_id=DEVICE_ID; PHPSESSID=SESSION_ID`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    expect(result).toEqual(response)
  })
})

describe("hasValidSession", () => {
  test("shoud returns false; no sessionid", () => {
    const client = createApiClient()
    const isValid = client["hasValidSession"]()

    expect(isValid).toBe(false)
  })

  test("shoud returns false; session expired", () => {
    const client = createApiClient()

    client["sessionId"] = "SESSION_ID"
    client["sessionDate"] = 0

    const isValid = client["hasValidSession"]()

    expect(isValid).toBe(false)
  })

  test("shoud returns true; just refreshed", () => {
    const client = createApiClient()

    client["sessionId"] = "SESSION_ID"
    client["sessionDate"] = Date.now()

    const isValid = client["hasValidSession"]()

    expect(isValid).toBe(true)
  })

  test("shoud returns true", () => {
    const client = createApiClient()

    client["sessionId"] = "SESSION_ID"
    client["sessionDate"] = Date.now() + configuration.api.sessionTTL - 500

    const isValid = client["hasValidSession"]()

    expect(isValid).toBe(true)
  })
})

describe("init", () => {
  test("it should abort; already init", async () => {
    const client = createApiClient()
    const mockConcurrency = jest.spyOn(client, "concurrency" as any)
    const mockHasValidSession = jest.spyOn(client, "hasValidSession" as any).mockReturnValue(true)
    const mockQuery = jest.spyOn(client, "request" as any).mockResolvedValue({})

    await client["init"]()

    expect(mockHasValidSession).toHaveBeenCalled()
    expect(mockConcurrency).toHaveBeenCalled()
    expect(mockQuery).not.toHaveBeenCalled()
  })

  test("it should not refresh the session; no session ID", async () => {
    const client = createApiClient()
    const mockQuery = jest.spyOn(client, "request" as any).mockResolvedValue({
      headers: new URLSearchParams(),
    })

    jest.spyOn(client, "hasValidSession" as any).mockReturnValue(false)

    await client["init"]()

    jest.clearAllTimers()

    expect(mockQuery).toHaveBeenCalledWith({
      method: "GET",
      path: configuration.api.paths.control,
    })
  })

  test("it should refresh the session", async () => {
    const client = createApiClient()

    jest.spyOn(client, "hasValidSession" as any).mockReturnValue(false)
    jest.spyOn(client, "request" as any).mockResolvedValue({
      headers: new URLSearchParams({
        "set-cookie": "Foo=Bar; PHPSESSID=SESSION_ID; Baz=Yaz",
      }),
    })

    await client["init"]()

    jest.clearAllTimers()

    expect(client["sessionId"]).toBe("SESSION_ID")
    expect(typeof client["sessionDate"]).toBe("number")
  })
})

describe("action", () => {
  test("it should query the API", async () => {
    const client = createApiClient()
    const mockInit = jest.spyOn(client, "init" as any).mockResolvedValue(undefined)
    const mockQuery = jest.spyOn(client, "request" as any).mockResolvedValue({
      data: "OK",
    })

    await client.action({
      topic: "my_topic",
      action: "my_action",
    })

    expect(mockInit).toHaveBeenCalled()
    expect(mockQuery).toHaveBeenCalledWith({
      method: "POST",
      path: configuration.api.paths.server,
      data: {
        my_action: "my_topic",
      },
    })
  })
})

describe("getDevices", () => {
  test("it should returns all the available devices", async () => {
    const response = {
      text: async () => `
        <html>
          <body>
            <div class="equipements">
              <div class="table_field">
                Name 1
                <input type="checkbox" id="topic_1" />
              </div>
              <div class="table_field">
                Name 2
                <input type="checkbox" id="topic_2" />
              </div>
            </div>
          </body>
        </html>
      `,
    }

    const client = createApiClient()
    const mockInit = jest.spyOn(client, "init" as any).mockResolvedValue(undefined)

    jest.spyOn(client, "request" as any).mockResolvedValue(response)

    const devices = await client.getDevices()

    expect(devices).toEqual([
      { topic: "topic_1", name: "Name 1" },
      { topic: "topic_2", name: "Name 2" },
    ])

    expect(mockInit).toHaveBeenCalled()
  })
})
