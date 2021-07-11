import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from "homebridge";
import * as configuration from "../../configuration";
import Accessory from "../Accessory";
import ApiClient from "../ApiClient";
import Device from "../Device";

interface PlatformConfiguration extends PlatformConfig {
  id: string;
}

export default class Platform implements DynamicPlatformPlugin {
  public readonly logger: Logger;
  public readonly config: PlatformConfig;
  public readonly homebridge: API;
  public readonly accessories: PlatformAccessory[] = [];
  private readonly pluginName: string = configuration.platform.pluginName;
  private readonly platformName: string = configuration.platform.platformName;

  constructor(logger: Logger, config: PlatformConfig, homebridge: API) {
    this.logger = logger;
    this.config = config;
    this.homebridge = homebridge;

    this.homebridge.on("didFinishLaunching", () => {
      this.removeAccessories();
      this.addAccessories();
    });
  }

  public configureAccessory(accessory: PlatformAccessory): void {
    this.accessories.push(accessory);
  }

  private async addAccessories(): Promise<void> {
    const { id } = this.config as PlatformConfiguration;
    const api = new ApiClient({ id });
    const devices = await api.getDevices();
    const { pluginName, platformName } = this;

    const accessories = devices.map((informations) => {
      const { name, topic } = informations;
      const device = new Device({ api, name, topic });
      const accessory = new Accessory({
        device,
        homebridge: this.homebridge,
      });

      return accessory.accessory;
    });

    this.homebridge.registerPlatformAccessories(pluginName, platformName, accessories);
  }

  private removeAccessories(): void {
    this.homebridge.unregisterPlatformAccessories(
      this.pluginName,
      this.platformName,
      this.accessories
    );

    this.accessories.splice(0);
  }
}
