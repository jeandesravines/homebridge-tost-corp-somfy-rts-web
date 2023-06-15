// Mocks

jest.mock("homebridge/lib/api", () => require("./tests/mocks/homebridge"))
jest.mock("node-fetch", () => require("./tests/mocks/node-fetch"))
