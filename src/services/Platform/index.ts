import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig } from "homebridge"
import * as _ from "lodash"
import * as configuration from "../../configuration"
import Accessory from "../Accessory"
import { AccessoryContext } from "../Accessory/types"
import ApiClient from "../ApiClient"
import Device from "../Device"

interface PlatformConfiguration extends PlatformConfig {
  id: string
  devices: PlatformConfigurationDevice[]
}

interface PlatformConfigurationDevice {
  topic: string
  name?: string
  duration?: number
}

export default class Platform implements DynamicPlatformPlugin {
  public readonly logger: Logger
  public readonly config: PlatformConfiguration
  public readonly homebridge: API
  public readonly accessories: PlatformAccessory<AccessoryContext>[] = []
  private readonly pluginName: string = configuration.platform.pluginName
  private readonly platformName: string = configuration.platform.platformName
  private readonly api: ApiClient

  constructor(logger: Logger, config: PlatformConfig, homebridge: API) {
    this.logger = logger
    this.config = config as PlatformConfiguration
    this.homebridge = homebridge
    this.api = new ApiClient({ id: this.config.id })

    this.homebridge.on("didFinishLaunching", () => {
      this.syncAccessories()
    })
  }

  public configureAccessory(accessory: PlatformAccessory<AccessoryContext>): void {
    this.accessories.push(accessory)
  }

  private async syncAccessories(): Promise<void> {
    const { pluginName, platformName } = this
    const accessories: PlatformAccessory<AccessoryContext>[] = this.config.devices?.map(
      (device) => {
        const { topic, name, duration } = device

        return Accessory.getAccessory({
          homebridge: this.homebridge,
          device: new Device({ api: this.api, topic, name, duration }),
          accessory: this.accessories.find(({ context }) => context.topic === topic),
        })
      }
    )

    const newest = _.differenceBy(accessories, this.accessories, "context.topic")
    const outdated = _.differenceBy(this.accessories, accessories, "context.topic")
    const updated = _.intersectionBy(accessories, this.accessories, "context.topic")

    if (newest.length) {
      this.homebridge.registerPlatformAccessories(pluginName, platformName, newest)
    }

    if (outdated.length) {
      this.homebridge.unregisterPlatformAccessories(pluginName, platformName, outdated)
    }

    if (updated.length) {
      this.homebridge.updatePlatformAccessories(updated)
    }

    // for (const { context } of outdated) {
    //   this.accessories.splice(
    //     this.accessories.findIndex((accessory) => {
    //       return accessory.context.topic === context.topic
    //     })
    //   )
    // }
  }
}
