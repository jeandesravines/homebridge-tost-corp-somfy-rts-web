global.fetch = jest.fn(() => require("../mocks/fetch").default)
jest.mock("homebridge/lib/api", () => require("../mocks/homebridge"))
