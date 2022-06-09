import initialize from "../../src"
import Platform from "../../src/services/Platform"

describe("index", () => {
  test("it should call the init function", () => {
    const api = {
      registerPlatform: jest.fn(),
    }

    initialize(api as any)

    expect(api.registerPlatform).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      Platform
    )
  })
})
