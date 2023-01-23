import { HomebridgeAPI } from "homebridge/lib/api"
import Platform from "."

interface CreatePlatformArgs {
  devices?: Array<{
    topic: string
    name?: string
    duration?: number
  }>
}

function createPlatform(args?: CreatePlatformArgs) {
  const homebridge = new HomebridgeAPI()
  const logger = console as any
  const config = {
    platform: "TOSTCorpSomfyRTSWeb",
    id: "DEVICE_ID",
    devices: args?.devices,
  }

  const platform = new Platform(logger, config, homebridge)

  const createAccessory = (index: number) => {
    return Object.assign(new homebridge.platformAccessory("Name " + index, "uuid-" + index), {
      context: {
        topic: "topic_" + index,
      },
    })
  }

  return { platform, homebridge, createAccessory }
}

describe("constructor", () => {
  test("on didFinishLaunching", () => {
    const { platform, homebridge } = createPlatform()
    const mockSyncDevices = jest.spyOn(platform as any, "syncAccessories")

    homebridge.emit("didFinishLaunching")

    expect(mockSyncDevices).toHaveBeenCalledTimes(1)
  })
})

describe("configureAccessory", () => {
  test("it should add the accessory", () => {
    const { platform } = createPlatform()
    const accessory = {
      context: {
        topic: "topic_1",
      },
    } as any

    platform["configureAccessory"](accessory)

    expect(platform.accessories).toEqual([accessory])
  })
})

describe("syncAccessories", () => {
  test("it should do nothing; no accessory at all", async () => {
    const { platform, homebridge } = createPlatform()
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")
    const mockUpdateAccessories = jest.spyOn(homebridge, "updatePlatformAccessories")

    await platform["syncAccessories"]()

    expect(platform["accessories"]).toEqual([])
    expect(mockRegisterAccessories).not.toHaveBeenCalled()
    expect(mockUnregisterAccessories).not.toHaveBeenCalled()
    expect(mockUpdateAccessories).not.toHaveBeenCalled()
  })

  test("it should sync accessories", async () => {
    const { platform, homebridge, createAccessory } = createPlatform({
      devices: [
        { topic: "topic_1", name: "Name 1 - Updated" },
        { topic: "topic_3", name: "Name 3" },
        { topic: "topic_4", name: "Name 4" },
      ],
    })

    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")
    const mockUpdateAccessories = jest.spyOn(homebridge, "updatePlatformAccessories")

    Object.assign(platform, {
      accessories: [createAccessory(1), createAccessory(2)],
    })

    await platform["syncAccessories"]()

    expect(mockRegisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [
        expect.objectContaining({ displayName: "Name 3", context: { topic: "topic_3" } }),
        expect.objectContaining({ displayName: "Name 4", context: { topic: "topic_4" } }),
      ]
    )

    expect(mockUnregisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [expect.objectContaining({ displayName: "Name 2", context: { topic: "topic_2" } })]
    )

    expect(mockUpdateAccessories).toHaveBeenCalledWith([
      expect.objectContaining({ displayName: "Name 1 - Updated", context: { topic: "topic_1" } }),
    ])
  })
})
