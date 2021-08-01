import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from "homebridge";
import * as _ from "lodash";
import * as configuration from "../../configuration";
import Accessory from "../Accessory";
import { AccessoryContext } from "../Accessory/types";
import ApiClient from "../ApiClient";
import Device from "../Device";

interface PlatformConfiguration extends PlatformConfig {
  id: string;
}

export default class Platform implements DynamicPlatformPlugin {
  public readonly logger: Logger;
  public readonly config: PlatformConfig;
  public readonly homebridge: API;
  public readonly accessories: PlatformAccessory<AccessoryContext>[] = [];
  private readonly pluginName: string = configuration.platform.pluginName;
  private readonly platformName: string = configuration.platform.platformName;

  constructor(logger: Logger, config: PlatformConfig, homebridge: API) {
    this.logger = logger;
    this.config = config;
    this.homebridge = homebridge;

    this.homebridge.on("didFinishLaunching", () => {
      this.syncAccessories();
    });
  }

  public configureAccessory(accessory: PlatformAccessory<AccessoryContext>): void {
    this.accessories.push(accessory);
  }

  private async syncAccessories(): Promise<void> {
    const { id } = this.config as PlatformConfiguration;
    const api = new ApiClient({ id });
    const devices = await api.getDevices();
    const { pluginName, platformName } = this;

    const accessories = devices.map((informations) => {
      const { name, topic } = informations;
      const device = new Device({ api, name, topic });
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

    this.homebridge.registerPlatformAccessories(pluginName, platformName, newest);
    this.homebridge.unregisterPlatformAccessories(pluginName, platformName, outdated);

    for (const { context } of outdated) {
      this.accessories.splice(
        this.accessories.findIndex((accessory) => {
          return accessory.context.topic === context.topic;
        })
      );
    }
  }
}
