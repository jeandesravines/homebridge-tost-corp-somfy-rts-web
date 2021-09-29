import { HomebridgeAPI } from "homebridge/lib/api";
import Platform from "../../../../src/services/Platform";

function createPlatform() {
  const homebridge = new HomebridgeAPI();
  const logger = console as any;
  const config = { id: "DEVICE_ID" } as any;
  const platform = new Platform(logger, config, homebridge);

  const createPlatformAccessory = (index: number) => {
    return Object.assign(new homebridge.platformAccessory("Name " + index, "uuid-" + index), {
      context: {
        topic: "topic_" + index,
      },
    });
  };

  const createApiDevice = (index: number) => {
    return {
      name: "Name " + index,
      topic: "topic_" + index,
    };
  };

  return { platform, homebridge, createApiDevice, createPlatformAccessory };
}

describe("constructor", () => {
  test("on didFinishLaunching", () => {
    const { platform, homebridge } = createPlatform();
    const mockSyncDevices = jest.spyOn(platform as any, "syncAccessories");

    jest.spyOn(platform["api"] as any, "getDevices").mockResolvedValue([]);

    homebridge.emit("didFinishLaunching");

    expect(mockSyncDevices).toHaveBeenCalledTimes(1);
  });
});

describe("configureAccessory", () => {
  test("it should add the accessory", () => {
    const { platform, createPlatformAccessory } = createPlatform();
    const accessory = createPlatformAccessory(1);

    platform["configureAccessory"](accessory);

    expect(platform.accessories).toEqual([accessory]);
  });
});

describe("syncAccessories", () => {
  test("it should do nothing; no accessory at all", async () => {
    const { platform, homebridge } = createPlatform();
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories");
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories");

    jest.spyOn(platform["api"] as any, "getDevices").mockResolvedValue([]);

    await platform["syncAccessories"]();

    expect(platform["accessories"]).toEqual([]);
    expect(mockRegisterAccessories).not.toHaveBeenCalled();
    expect(mockUnregisterAccessories).not.toHaveBeenCalled();
  });

  test("it should do nothing; no new accessory", async () => {
    const { platform, homebridge, createPlatformAccessory, createApiDevice } = createPlatform();
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories");
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories");
    const accessories = [createPlatformAccessory(1), createPlatformAccessory(2)];

    jest
      .spyOn(platform["api"] as any, "getDevices")
      .mockResolvedValue([createApiDevice(1), createApiDevice(2)]);

    Object.assign(platform, {
      accessories: accessories.slice(0),
    });

    await platform["syncAccessories"]();

    expect(mockRegisterAccessories).not.toHaveBeenCalled();
    expect(mockUnregisterAccessories).not.toHaveBeenCalled();
  });

  test("it should sync accessories", async () => {
    const { platform, homebridge, createApiDevice, createPlatformAccessory } = createPlatform();
    const mockRegisterAccessories = jest.spyOn(homebridge, "registerPlatformAccessories");
    const mockUnregisterAccessories = jest.spyOn(homebridge, "unregisterPlatformAccessories");
    const accessories = [createPlatformAccessory(1), createPlatformAccessory(2)];

    jest
      .spyOn(platform["api"] as any, "getDevices")
      .mockResolvedValue([createApiDevice(1), createApiDevice(3), createApiDevice(4)]);

    Object.assign(platform, {
      accessories: accessories.slice(0),
    });

    await platform["syncAccessories"]();

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
    );

    expect(mockUnregisterAccessories).toHaveBeenCalledWith(
      "homebridge-tost-corp-somfy-rts-web",
      "TOSTCorpSomfyRTSWeb",
      [accessories[1]]
    );
  });
});
