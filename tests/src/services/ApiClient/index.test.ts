import ApiClient from "../../../../src/services/ApiClient";
import * as configuration from "../../../../src/configuration";

function createApiClient() {
  return new ApiClient({ id: "DEVICE_ID" });
}

describe("query", () => {
  test("it should use Device ID", async () => {
    const client = createApiClient();
    const mockAxios = jest.spyOn(client["axios"], "request").mockResolvedValue({ data: "ok" });

    const result = await client["query"]({
      url: "http://localhost",
      method: "GET",
      data: { foo: "bar" },
    });

    expect(mockAxios).toHaveBeenCalledWith({
      url: "http://localhost",
      method: "GET",
      data: "foo=bar",
      headers: {
        Cookie: `device_id=DEVICE_ID;`,
      },
    });

    expect(result).toEqual({
      data: "ok",
    });
  });

  test("it should use Session ID", async () => {
    const client = createApiClient();
    const mockAxios = jest.spyOn(client["axios"], "request").mockResolvedValue({ data: "ok" });

    client["sessionId"] = "SESSION_ID";

    const result = await client["query"]({
      url: "http://localhost",
      method: "GET",
      data: { foo: "bar" },
    });

    expect(mockAxios).toHaveBeenCalledWith({
      url: "http://localhost",
      method: "GET",
      data: "foo=bar",
      headers: {
        Cookie: `device_id=DEVICE_ID; PHPSESSID=SESSION_ID`,
      },
    });

    expect(result).toEqual({
      data: "ok",
    });
  });

  test("it should send as x-www-form-urlencoded", async () => {
    const client = createApiClient();
    const mockAxios = jest.spyOn(client["axios"], "request").mockResolvedValue({ data: "ok" });

    client["sessionId"] = "SESSION_ID";

    const result = await client["query"]({
      url: "http://localhost",
      method: "POST",
      data: { foo: "bar" },
    });

    expect(mockAxios).toHaveBeenCalledWith({
      url: "http://localhost",
      method: "POST",
      data: "foo=bar",
      headers: {
        Cookie: `device_id=DEVICE_ID; PHPSESSID=SESSION_ID`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(result).toEqual({
      data: "ok",
    });
  });
});

describe("hasValidSession", () => {
  test("shoud returns false; no sessionid", () => {
    const client = createApiClient();
    const isValid = client["hasValidSession"]();

    expect(isValid).toBe(false);
  });

  test("shoud returns false; session expired", () => {
    const client = createApiClient();

    client["sessionId"] = "SESSION_ID";
    client["sessionDate"] = 0;

    const isValid = client["hasValidSession"]();

    expect(isValid).toBe(false);
  });

  test("shoud returns true; just refreshed", () => {
    const client = createApiClient();

    client["sessionId"] = "SESSION_ID";
    client["sessionDate"] = Date.now();

    const isValid = client["hasValidSession"]();

    expect(isValid).toBe(true);
  });

  test("shoud returns true", () => {
    const client = createApiClient();

    client["sessionId"] = "SESSION_ID";
    client["sessionDate"] = Date.now() + configuration.api.sessionTTL - 500;

    const isValid = client["hasValidSession"]();

    expect(isValid).toBe(true);
  });
});

describe("init", () => {
  test("it should abort; already init", async () => {
    const client = createApiClient();
    const mockConcurrency = jest.spyOn(client as any, "concurrency");
    const mockHasValidSession = jest.spyOn(client as any, "hasValidSession").mockReturnValue(true);
    const mockQuery = jest.spyOn(client as any, "query").mockResolvedValue({});

    await client["init"]();

    expect(mockHasValidSession).toHaveBeenCalled();
    expect(mockConcurrency).toHaveBeenCalled();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test("it should not refresh the session; no session ID", async () => {
    const client = createApiClient();
    const mockQuery = jest.spyOn(client as any, "query").mockResolvedValue({
      headers: {},
    });

    jest.spyOn(client as any, "hasValidSession").mockReturnValue(false);

    await client["init"]();

    jest.clearAllTimers();

    expect(mockQuery.mock.calls[0]).toEqual([
      {
        method: "POST",
        url: configuration.api.paths.server,
        data: {
          device_id: "DEVICE_ID",
          check: "Check",
        },
      },
    ]);

    expect(mockQuery.mock.calls[1]).toEqual([
      {
        method: "POST",
        url: configuration.api.paths.server,
        data: {
          device_id: "DEVICE_ID",
          end_step_one: "Submit",
        },
      },
    ]);
  });

  test("it should refresh the session", async () => {
    const client = createApiClient();

    jest.spyOn(client as any, "hasValidSession").mockReturnValue(false);
    jest.spyOn(client as any, "query").mockResolvedValue({
      headers: {
        "set-cookie": ["Foo=Bar; PHPSESSID=SESSION_ID; Baz=Yaz"],
      },
    });

    await client["init"]();

    jest.clearAllTimers();

    expect(client["sessionId"]).toBe("SESSION_ID");
    expect(typeof client["sessionDate"]).toBe("number");
  });
});

describe("action", () => {
  test("it should query the API", async () => {
    const client = createApiClient();
    const mockInit = jest.spyOn(client as any, "init").mockResolvedValue(undefined);
    const mockQuery = jest.spyOn(client as any, "query").mockResolvedValue({
      data: "OK",
    });

    await client.action({
      topic: "my_topic",
      action: "my_action",
    });

    expect(mockInit).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith({
      method: "POST",
      url: configuration.api.paths.server,
      data: {
        my_action: "my_topic",
      },
    });
  });
});

describe("getDevices", () => {
  test("it should returns all the available devices", async () => {
    const data = `
      <html>
        <body>
          <div class="equipements">
            <table>
              <tbody>
                <tr class="column_title_text">
                  <td><b>Topic</b></td>
                  <td><b>Name</b></td>
                </tr>
                <tr>
                  <td><div class="table_field_edit">topic_1</div></td>
                  <td><div class="table_field_edit">Name 1</div></td>
                  <td><div class="table_field_edit">Things 1</div></td>
                </tr>
                <tr>
                  <td><div class="table_field_edit">topic_2</div></td>
                  <td><div class="table_field_edit">Name 2</div></td>
                  <td><div class="table_field_edit">Things 2</div></td>
                </tr>
                </tr>
                <tr>
                  <td><div class="input-field"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const client = createApiClient();
    const mockInit = jest.spyOn(client as any, "init").mockResolvedValue(undefined);

    jest.spyOn(client as any, "query").mockResolvedValue({ data });

    const devices = await client.getDevices();

    expect(devices).toEqual([
      { topic: "topic_1", name: "Name 1" },
      { topic: "topic_2", name: "Name 2" },
    ]);

    expect(mockInit).toHaveBeenCalled();
  });
});
