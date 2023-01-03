jest.mock("node-fetch", () => require("./tests/mocks/node-fetch"))
jest.mock("homebridge/lib/api", () => require("./tests/mocks/homebridge"))
