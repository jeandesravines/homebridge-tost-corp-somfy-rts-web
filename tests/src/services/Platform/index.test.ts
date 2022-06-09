import { HomebridgeAPI } from "homebridge/lib/api"
import Platform from "../../../../src/services/Platform"

interface CreatePlatformArgs {
  devices?: Array<{
    topic: string
    duration?: number
    excluded?: boolean
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

  const createPlatformAccessory = (index: number) => {
    return Object.assign(new homebridge.platformAccessory("Name " + index, "uuid-" + index), {
      context: {
        topic: "topic_" + index,
      },
    })
  }

  const createApiDevice = (index: number) => {
    return {
      name: "Name " + index,
      topic: "topic_" + index,
    }
  }

  return { platform, homebridge, createApiDevice, createPlatformAccessory }
}

describe("constructor", () => {
  test("on didFinishLaunching", () => {
    const { platform, homebridge } = createPlatform()
    const mockSyncDevices = jest.spyOn(platform as any, "syncAccessories")

    jest.spyOn(platform["api"] as any, "getDevices").mockResolvedValue([])

    homebridge.emit("didFinishLaunching")

    expect(mockSyncDevices).toHaveBeenCalledTimes(1)
  })
})

describe("configureAccessory", () => {
  test("it should add the accessory", () => {
    const { platform, createPlatformAccessory } = createPlatform()
    const accessory = createPlatformAccessory(1)

    platform["configureAccessory"](accessory)

    expect(platform.accessories).toEqual([accessory])
  })
})

describe("getConfigurationDeviceByTopic", () => {
  test("it should return null", () => {
    const { platform } = createPlatform()
    const device = platform["getConfigurationDeviceByTopic"]("topic_1")

    expect(device).toEqual(null)
  })

  test("it should return a device", () => {
    const { platform } = createPlatform({
      devices: [
        {
          topic: "topic_1",
          duration: 10_000,
        },
      ],
    })

    const device = platform["getConfigurationDeviceByTopic"]("topic_1")

    expect(device).toEqual({
      topic: "topic_1",
      duration: 10_000,
    })
  })
})

describe("syncAccessories", () => {
  test("it should do nothing; no accessory at all", async () => {
    const { platform, homebridge } = createPlatform()
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")

    jest.spyOn(platform["api"] as any, "getDevices").mockResolvedValue([])

    await platform["syncAccessories"]()

    expect(platform["accessories"]).toEqual([])
    expect(mockRegisterAccessories).not.toHaveBeenCalled()
    expect(mockUnregisterAccessories).not.toHaveBeenCalled()
  })

  test("it should do nothing; no new accessory", async () => {
    const { platform, homebridge, createPlatformAccessory, createApiDevice } = createPlatform()
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")
    const mockGetConfigurationDeviceByTopic = jest.spyOn(
      platform as any,
      "getConfigurationDeviceByTopic"
    )

    const accessories = [createPlatformAccessory(1), createPlatformAccessory(2)]

    jest
      .spyOn(platform["api"] as any, "getDevices")
      .mockResolvedValue([createApiDevice(1), createApiDevice(2)])

    Object.assign(platform, {
      accessories: accessories.slice(0),
    })

    await platform["syncAccessories"]()

    expect(mockRegisterAccessories).not.toHaveBeenCalled()
    expect(mockUnregisterAccessories).not.toHaveBeenCalled()

    expect(mockGetConfigurationDeviceByTopic).toHaveBeenNthCalledWith(1, "topic_1")
    expect(mockGetConfigurationDeviceByTopic).toHaveBeenNthCalledWith(2, "topic_2")
  })

  test("it should sync accessories", async () => {
    const { platform, homebridge, createApiDevice, createPlatformAccessory } = createPlatform()
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")
    const accessories = [createPlatformAccessory(1), createPlatformAccessory(2)]

    jest
      .spyOn(platform["api"] as any, "getDevices")
      .mockResolvedValue([createApiDevice(1), createApiDevice(3), createApiDevice(4)])

    Object.assign(platform, {
      accessories: accessories.slice(0),
    })

    await platform["syncAccessories"]()

    expect(mockRegisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [
        expect.objectContaining({
          displayName: "Name 3",
          context: {
            topic: "topic_3",
          },
        }),
        expect.objectContaining({
          displayName: "Name 4",
          context: {
            topic: "topic_4",
          },
        }),
      ]
    )

    expect(mockUnregisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [accessories[1]]
    )
  })
  test("it should exclude one accessory", async () => {
    const { platform, homebridge, createApiDevice, createPlatformAccessory } = createPlatform({
      devices: [
        {
          topic: "topic_3",
          excluded: true,
        },
      ],
    })

    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories")
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories")
    const accessories = [createPlatformAccessory(1), createPlatformAccessory(2)]

    jest
      .spyOn(platform["api"] as any, "getDevices")
      .mockResolvedValue([createApiDevice(1), createApiDevice(3), createApiDevice(4)])

    Object.assign(platform, {
      accessories: accessories.slice(0),
    })

    await platform["syncAccessories"]()

    expect(mockRegisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [
        expect.objectContaining({
          displayName: "Name 4",
          context: {
            topic: "topic_4",
          },
        }),
      ]
    )

    expect(mockUnregisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [accessories[1]]
    )
  })
})
