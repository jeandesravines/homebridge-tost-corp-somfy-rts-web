// Mocks

jest.mock("homebridge/lib/api", () => require("./tests/mocks/homebridge"))

// Fetch

global.fetch = jest.fn()
