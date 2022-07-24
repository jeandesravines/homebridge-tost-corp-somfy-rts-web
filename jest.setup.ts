jest.mock("axios", () => require("./tests/mocks/axios"))
jest.mock("homebridge/lib/api", () => require("./tests/mocks/homebridge"))
