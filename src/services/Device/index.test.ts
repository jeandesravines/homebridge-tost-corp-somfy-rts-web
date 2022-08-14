import Device from "."
import { jestAdvanceTimersByTime } from "../../../tests/helpers/jest/timers"
import ApiClient from "../ApiClient"
import { DeviceEvent, DeviceState } from "./types"

interface CreateDeviceArgs {
  duration?: number
}

function createDevice(args?: CreateDeviceArgs) {
  const api = new ApiClient({ id: "DEVICE_ID" })

  jest.spyOn(api, "init").mockResolvedValue(undefined)
  jest.spyOn(api, "action").mockResolvedValue(undefined)

  const duration = args?.duration || 20_000
  const durationDelta = duration * 0.1

  const device = new Device({
    api,
    name: "Name 1",
    topic: "topic_1",
    duration,
    durationDelta,
  })

  return { api, device }
}

describe("constructor", () => {
  test("it use the default duration", () => {
    const { device } = createDevice()

    expect(device["duration"]).toBe(20_000)
  })

  test("it use the given duration", () => {
    const { device } = createDevice({ duration: 10_000 })

    expect(device["duration"]).toBe(10_000)
  })
})

describe("toPercent", () => {
  test("it should returns 0 : position === 0", () => {
    const { device } = createDevice()
    const result = device["toPercent"](0)

    expect(result).toBe(0)
  })

  test("it should returns 0 : position < 1", () => {
    const { device } = createDevice()
    const result = device["toPercent"](0.9)

    expect(result).toBe(0)
  })

  test("it should returns the delta : position === 1", () => {
    const { device } = createDevice()
    const result = device["toPercent"](1)

    expect(result).toBe(10)
  })

  test("it should returns 100 : position === 100", () => {
    const { device } = createDevice()
    const result = device["toPercent"](100)

    expect(result).toBe(100)
  })

  test("it should returns 100 : position > 100 - delta", () => {
    const { device } = createDevice()
    const result = device["toPercent"](99.1)

    expect(result).toBe(100)
  })

  test("it should returns the position plus the delta", () => {
    const { device } = createDevice()
    const result = device["toPercent"](42)

    expect(result).toBe(52)
  })
})

describe("toPosition", () => {
  test("it should returns 0 : percent === O", () => {
    const { device } = createDevice()
    const result = device["toPosition"](0)

    expect(result).toBe(0)
  })

  test("it should returns 100 : percent === 100", () => {
    const { device } = createDevice()
    const result = device["toPosition"](100)

    expect(result).toBe(100)
  })

  test("it should returns 1 : percent < delta", () => {
    const { device } = createDevice()
    const result = device["toPosition"](9)

    expect(result).toBe(1)
  })

  test("it should returns 1 : percent === delta", () => {
    const { device } = createDevice()
    const result = device["toPosition"](10)

    expect(result).toBe(1)
  })

  test("it should returns position minus delta : percent > delta", () => {
    const { device } = createDevice()
    const result = device["toPosition"](42)

    expect(result).toBe(32)
  })
})

describe("getState", () => {
  test("it returns the current state", () => {
    const { device } = createDevice()

    device["state"] = DeviceState.INCREASING

    expect(device.getState()).toBe(DeviceState.INCREASING)
  })
})

describe("getPosition", () => {
  test("it returns the current position", () => {
    const { device } = createDevice()

    device["percent"] = 42

    expect(device.getPosition()).toBe(32)
  })
})

describe("handleStateChange", () => {
  test("it should emit event", () => {
    const { device } = createDevice()
    const mockHandler = jest.fn()

    device.on(DeviceEvent.STATE_CHANGE, mockHandler)
    device["handleStateChange"](DeviceState.DECREASING)

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        value: DeviceState.DECREASING,
      })
    )
  })
})

describe("handlePercentChange", () => {
  test("it should emit and change the percent", () => {
    const { device } = createDevice()
    const mockHandler = jest.fn()

    device.on(DeviceEvent.POSITION_CHANGE, mockHandler)
    device["handlePercentChange"](42)

    expect(mockHandler).toHaveBeenCalled()
    expect(device["percent"]).toBe(42)
  })

  test("it should emit and clamp the value to 0", () => {
    const { device } = createDevice()
    const mockEmit = jest.spyOn(device, "emit")

    device["handlePercentChange"](-42)

    expect(device["percent"]).toBe(0)
    expect(mockEmit).toHaveBeenCalledWith(DeviceEvent.POSITION_CHANGE)
  })

  test("it should emit and clamp the value to 1", () => {
    const { device } = createDevice()
    const mockEmit = jest.spyOn(device, "emit")

    device["handlePercentChange"](142)

    expect(device["percent"]).toBe(100)
    expect(mockEmit).toHaveBeenCalledWith(DeviceEvent.POSITION_CHANGE)
  })
})

describe("up", () => {
  test("it should call action to increase", async () => {
    const { device, api } = createDevice()
    const mockAction = jest.spyOn(api, "action")
    const mockHandleChange = jest
      .spyOn(device as any, "handleStateChange")
      .mockReturnValue(undefined)

    await device.up()

    expect(mockAction).toHaveBeenCalledWith({
      action: "up",
      topic: "topic_1",
    })

    expect(mockHandleChange).toHaveBeenCalledWith(DeviceState.INCREASING)
  })
})

describe("down", () => {
  test("it should call action to decrease", async () => {
    const { device, api } = createDevice()
    const mockAction = jest.spyOn(api, "action")
    const mockHandleChange = jest
      .spyOn(device as any, "handleStateChange")
      .mockReturnValue(undefined)

    await device.down()

    expect(mockAction).toHaveBeenCalledWith({
      action: "down",
      topic: "topic_1",
    })

    expect(mockHandleChange).toHaveBeenCalledWith(DeviceState.DECREASING)
  })
})

describe("stop", () => {
  test("it should not stop; position === 0", async () => {
    const { device, api } = createDevice()
    const mockAction = jest.spyOn(api, "action")
    const mockHandleChange = jest
      .spyOn(device as any, "handleStateChange")
      .mockReturnValue(undefined)

    device["percent"] = 0

    await device.stop()

    expect(mockAction).not.toHaveBeenCalled()
    expect(mockHandleChange).toHaveBeenCalledWith(DeviceState.STOPPED)
  })

  test("it should not stop; position === 100", async () => {
    const { device, api } = createDevice()
    const mockAction = jest.spyOn(api, "action")
    const mockHandleChange = jest
      .spyOn(device as any, "handleStateChange")
      .mockReturnValue(undefined)

    device["percent"] = 100

    await device.stop()

    expect(mockAction).not.toHaveBeenCalled()
    expect(mockHandleChange).toHaveBeenCalledWith(DeviceState.STOPPED)
  })

  test("it should stop", async () => {
    const { device, api } = createDevice()
    const mockAction = jest.spyOn(api, "action")
    const mockHandleChange = jest
      .spyOn(device as any, "handleStateChange")
      .mockReturnValue(undefined)

    device["percent"] = 42

    await device.stop()

    expect(mockAction).toHaveBeenCalledWith({
      action: "stop",
      topic: "topic_1",
    })

    expect(mockHandleChange).toHaveBeenCalledWith(DeviceState.STOPPED)
  })
})

describe("setPosition", () => {
  test("it should do nothing; difference === 0, position in ]0, 100[", async () => {
    const { device } = createDevice()
    const mockCancelUpdate = jest.spyOn(device as any, "cancelUpdate")
    const mockUp = jest.spyOn(device as any, "up")
    const mockDown = jest.spyOn(device as any, "down")
    const mockHandlePercentChange = jest.spyOn(device as any, "handlePercentChange")

    device["percent"] = 52

    await device.setPosition(42)

    expect(mockCancelUpdate).toHaveBeenCalled()
    expect(mockUp).not.toHaveBeenCalled()
    expect(mockDown).not.toHaveBeenCalled()
    expect(mockHandlePercentChange).not.toHaveBeenCalled()
  })

  test("it should decrease even if position === 0", async () => {
    const { device } = createDevice()
    const mockCancelUpdate = jest.spyOn(device as any, "cancelUpdate")
    const mockDown = jest.spyOn(device as any, "down")
    const mockHandlePercentChange = jest.spyOn(device as any, "handlePercentChange")

    device["percent"] = 0

    await device.setPosition(0)

    expect(mockCancelUpdate).toHaveBeenCalled()
    expect(mockDown).toHaveBeenCalled()
    expect(mockHandlePercentChange).not.toHaveBeenCalled()
  })

  test("it should increase even if position === 100", async () => {
    const { device } = createDevice()
    const mockCancelUpdate = jest.spyOn(device as any, "cancelUpdate")
    const mockUp = jest.spyOn(device as any, "up")
    const mockHandlePercentChange = jest.spyOn(device as any, "handlePercentChange")

    device["percent"] = 100

    await device.setPosition(100)

    expect(mockCancelUpdate).toHaveBeenCalled()
    expect(mockUp).toHaveBeenCalled()
    expect(mockHandlePercentChange).not.toHaveBeenCalled()
  })

  test("it should increase and update position", async () => {
    const { device } = createDevice()
    const mockCancelUpdate = jest.spyOn(device as any, "cancelUpdate")
    const mockUp = jest.spyOn(device as any, "up")
    const mockStop = jest.spyOn(device as any, "stop")
    const mockHandlePercentChange = jest.spyOn(device as any, "handlePercentChange")
    const increment = 5

    const start = 52
    const end = 78
    const times = Math.ceil((end - start) / increment)

    device["percent"] = start

    device.setPosition(68)
    await jestAdvanceTimersByTime(12000)

    expect(mockCancelUpdate).toHaveBeenCalledTimes(1)
    expect(mockHandlePercentChange).toHaveBeenCalledTimes(times)
    expect(mockHandlePercentChange).toHaveBeenNthCalledWith(times, end)

    expect(mockUp).toHaveBeenCalledAfter(mockCancelUpdate as any)
    expect(mockHandlePercentChange).toHaveBeenCalledAfter(mockUp as any)
    expect(mockStop).toHaveBeenCalledAfter(mockHandlePercentChange as any)

    for (let i = 1; i < times; i++) {
      expect(mockHandlePercentChange).toHaveBeenNthCalledWith(i, start + i * increment)
    }
  })

  test("it should increase, cancel, decrease, stop", async () => {
    const { device } = createDevice()
    const mockCancelUpdate = jest.spyOn(device as any, "cancelUpdate")
    const mockUp = jest.spyOn(device as any, "up")
    const mockDown = jest.spyOn(device as any, "down")
    const mockStop = jest.spyOn(device as any, "stop")
    const mockHandlePercentChange = jest.spyOn(device as any, "handlePercentChange")

    device["percent"] = 50

    device.setPosition(99)
    await jestAdvanceTimersByTime(4000)

    device.setPosition(45)
    await jestAdvanceTimersByTime(4000)

    const invocationCallOrders = [
      mockCancelUpdate.mock.invocationCallOrder[0],
      mockUp.mock.invocationCallOrder[0],
      mockHandlePercentChange.mock.invocationCallOrder[0],
      mockHandlePercentChange.mock.invocationCallOrder[1],
      mockHandlePercentChange.mock.invocationCallOrder[2],
      mockHandlePercentChange.mock.invocationCallOrder[3],
      mockCancelUpdate.mock.invocationCallOrder[1],
      mockDown.mock.invocationCallOrder[0],
      mockHandlePercentChange.mock.invocationCallOrder[4],
      mockHandlePercentChange.mock.invocationCallOrder[5],
      mockStop.mock.invocationCallOrder[0],
    ]

    expect(mockCancelUpdate).toHaveBeenCalledTimes(2)
    expect(mockHandlePercentChange).toHaveBeenCalledTimes(8)
    expect(mockHandlePercentChange).toHaveBeenNthCalledWith(4, 70)
    expect(mockHandlePercentChange).toHaveBeenNthCalledWith(6, 60)
    expect(mockHandlePercentChange).toHaveBeenNthCalledWith(8, 55)
    expect(mockStop).toHaveBeenCalledTimes(1)

    for (let i = 1; i < invocationCallOrders.length; i++) {
      expect(invocationCallOrders[i]).toBeGreaterThan(invocationCallOrders[i - 1])
    }
  })
})
