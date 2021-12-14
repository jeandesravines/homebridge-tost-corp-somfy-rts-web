import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from "homebridge";
import * as _ from "lodash";
import * as configuration from "../../configuration";
import Accessory from "../Accessory";
import { AccessoryContext } from "../Accessory/types";
import ApiClient from "../ApiClient";
import Device from "../Device";

interface PlatformConfiguration extends PlatformConfig {
  id: string;
  devices: [
    {
      topic: string;
      duration: number;
    }
  ];
}

export default class Platform implements DynamicPlatformPlugin {
  public readonly logger: Logger;
  public readonly config: PlatformConfiguration;
  public readonly homebridge: API;
  public readonly accessories: PlatformAccessory<AccessoryContext>[] = [];
  private readonly pluginName: string = configuration.platform.pluginName;
  private readonly platformName: string = configuration.platform.platformName;
  private readonly api: ApiClient;

  constructor(logger: Logger, config: PlatformConfig, homebridge: API) {
    this.logger = logger;
    this.config = config as PlatformConfiguration;
    this.homebridge = homebridge;
    this.api = new ApiClient({ id: this.config.id });

    this.homebridge.on("didFinishLaunching", () => {
      this.syncAccessories();
    });
  }

  public configureAccessory(accessory: PlatformAccessory<AccessoryContext>): void {
    this.accessories.push(accessory);
  }

  private async syncAccessories(): Promise<void> {
    const { pluginName, platformName } = this;
    const devices = await this.api.getDevices();
    const configDevices = this.config.devices;

    const accessories = devices.map((informations) => {
      const { name, topic } = informations;
      let duration = 20_000;

      if (configDevices != null) {
        configDevices.forEach((item) => {
          if (item.topic == topic) {
            duration = item.duration;
          }
        });
      }

      const device = new Device({ api: this.api, name, topic, duration: duration });
      const existing = this.accessories.find(({ context }) => {
        return context.topic === topic;
      });

      const accessory = new Accessory({
        device,
        accessory: existing,
        homebridge: this.homebridge,
      });

      return accessory.accessory;
    });

    const newest = _.differenceBy(accessories, this.accessories, "context.topic");
    const outdated = _.differenceBy(this.accessories, accessories, "context.topic");

    if (newest.length) {
      this.homebridge.registerPlatformAccessories(pluginName, platformName, newest);
    }

    if (outdated.length) {
      this.homebridge.unregisterPlatformAccessories(pluginName, platformName, outdated);
    }

    for (const { context } of outdated) {
      this.accessories.splice(
        this.accessories.findIndex((accessory) => {
          return accessory.context.topic === context.topic;
        })
      );
    }
  }
}
