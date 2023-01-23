import { HomebridgeAPI } from "homebridge/lib/api"
import Accessory from "."
import ApiClient from "../ApiClient"
import Device from "../Device"
import { DeviceEvent, DeviceState } from "../Device/types"
import { AccessoryContext } from "./types"

interface CreateAccessoryArgs {
  withPlatformAccessory?: boolean
}

function createAccessory(args?: CreateAccessoryArgs) {
  const { withPlatformAccessory } = args ?? {}

  const homebridge = new HomebridgeAPI()
  const api = new ApiClient({ id: "DEVICE_ID" })
  const device = new Device({ api, name: "Name 1", topic: "topic_1" })

  const platformAccessory = withPlatformAccessory
    ? new homebridge.platformAccessory<AccessoryContext>("Name 2", "uuid-2")
    : undefined

  const accessory = new Accessory({ device, homebridge, accessory: platformAccessory })

  return {
    accessory,
    device,
    homebridge,
  }
}

describe("constructor", () => {
  test("should use the device's name - no platform accessory", () => {
    const { accessory } = createAccessory()

    expect(accessory.accessory.displayName).toBe("Name 1")
    expect(accessory.accessory.displayName).not.toBe("uuid-2")
  })

  test("should use the device's name", () => {
    const { accessory } = createAccessory({ withPlatformAccessory: true })

    expect(accessory.accessory.displayName).toBe("Name 1")
    expect(accessory.accessory.UUID).toBe("uuid-2")
  })
})

describe("getCurrentPosition", () => {
  test("it should returns the device position", () => {
    const { accessory, device } = createAccessory()
    const mockGetPosition = jest.spyOn(device as any, "getPosition").mockReturnValue(42)

    const position = accessory["getCurrentPosition"]()

    expect(position).toBe(42)
    expect(mockGetPosition).toHaveBeenCalled()
  })
})

describe("handleCurrentPositionChange", () => {
  test("it should be registered as event handler", () => {
    const { accessory, device } = createAccessory()
    const mockHandler = jest
      .spyOn(accessory as any, "handleCurrentPositionChange")
      .mockReturnValue(undefined)

    device.emit(DeviceEvent.POSITION_CHANGE)

    expect(mockHandler).toHaveBeenCalled()
  })

  test("it should update the characteristic", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.CurrentPosition)
    const mockUpdateValue = jest.spyOn(characteristic, "updateValue")

    jest.spyOn(device as any, "getPosition").mockReturnValue(42)

    accessory["handleCurrentPositionChange"]()

    expect(mockUpdateValue).toHaveBeenCalledWith(42)
  })
})

describe("getPositionState", () => {
  test("it should returns STOPPED as a default value", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap

    jest.spyOn(device as any, "getState").mockReturnValue(null)

    const state = accessory["getPositionState"]()

    expect(state).toBe(Characteristic.PositionState.STOPPED)
  })

  test("it should returns STOPPED", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap

    jest.spyOn(device as any, "getState").mockReturnValue(DeviceState.STOPPED)

    const state = accessory["getPositionState"]()

    expect(state).toBe(Characteristic.PositionState.STOPPED)
  })

  test("it should returns INCREASING", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap

    jest.spyOn(device as any, "getState").mockReturnValue(DeviceState.INCREASING)

    const state = accessory["getPositionState"]()

    expect(state).toBe(Characteristic.PositionState.INCREASING)
  })

  test("it should returns DECREASING", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap

    jest.spyOn(device as any, "getState").mockReturnValue(DeviceState.DECREASING)

    const state = accessory["getPositionState"]()

    expect(state).toBe(Characteristic.PositionState.DECREASING)
  })
})

describe("handlePositionStateChange", () => {
  test("it should be registered as event handler", () => {
    const { accessory, device } = createAccessory()
    const mockHandler = jest.spyOn(accessory as any, "handlePositionStateChange")

    device.emit(DeviceEvent.STATE_CHANGE)

    expect(mockHandler).toHaveBeenCalled()
  })

  test("it should update the characteristic", () => {
    const { accessory, device, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.PositionState)
    const mockUpdateValue = jest.spyOn(characteristic, "updateValue")

    jest.spyOn(device as any, "getState").mockReturnValue(DeviceState.DECREASING)

    accessory["handlePositionStateChange"]()

    expect(mockUpdateValue).toHaveBeenCalledWith(Characteristic.PositionState.DECREASING)
  })
})

describe("setTargetPosition", () => {
  test("it should set the device position", () => {
    const { accessory, device } = createAccessory()
    const mockSetPosition = jest.spyOn(device, "setPosition").mockResolvedValue(undefined)

    accessory["setTargetPosition"](42)

    expect(mockSetPosition).toHaveBeenCalledWith(42)
  })
})

describe("getTargetPosition", () => {
  test("it should returns the new position", () => {
    const { accessory } = createAccessory()

    accessory["position"] = 42

    const targetPosition = accessory["getTargetPosition"]()

    expect(targetPosition).toBe(42)
  })
})

describe("currentPosition characteristic", () => {
  test("onGet", () => {
    const { accessory, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.CurrentPosition)
    const mockGetValue = jest.spyOn(accessory as any, "getCurrentPosition").mockReturnValue(42)
    const value = characteristic["getHandler"]()

    expect(value).toBe(42)
    expect(mockGetValue).toHaveBeenCalled()
  })
})

describe("positionState characteristic", () => {
  test("onGet", () => {
    const { accessory, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.PositionState)
    const mockGetValue = jest
      .spyOn(accessory as any, "getPositionState")
      .mockReturnValue(Characteristic.PositionState.INCREASING)

    const value = characteristic["getHandler"]()

    expect(value).toBe(Characteristic.PositionState.INCREASING)
    expect(mockGetValue).toHaveBeenCalled()
  })
})

describe("targetPosition characteristic", () => {
  test("onGet", () => {
    const { accessory, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.TargetPosition)
    const mockGetValue = jest.spyOn(accessory as any, "getTargetPosition").mockReturnValue(42)
    const value = characteristic["getHandler"]()

    expect(value).toBe(42)
    expect(mockGetValue).toHaveBeenCalled()
  })

  test("onSet", () => {
    const { accessory, homebridge } = createAccessory()
    const { Characteristic } = homebridge.hap
    const characteristic = accessory["service"].getCharacteristic(Characteristic.TargetPosition)
    const mockGetValue = jest.spyOn(accessory as any, "setTargetPosition").mockReturnValue(42)

    characteristic["setHandler"](42)

    expect(mockGetValue).toHaveBeenCalledWith(42)
  })
})
