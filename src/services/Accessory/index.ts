import { API, CharacteristicValue, PlatformAccessory, Service } from "homebridge"
import * as configuration from "../../configuration"
import Device from "../Device"
import { DeviceEvent, DeviceState } from "../Device/types"
import { AccessoryContext } from "./types"

interface ConstructorArgs {
  device: Device
  accessory?: PlatformAccessory<AccessoryContext>
  homebridge: API
}

export default class Accessory {
  private readonly service: Service
  private readonly device: Device
  private readonly homebridge: API
  private position = configuration.somfy.initialPosition

  public readonly accessory: PlatformAccessory<AccessoryContext>

  constructor(args: ConstructorArgs) {
    const { homebridge, device, accessory } = args

    const { platformName } = configuration.platform
    const { Service, Characteristic } = homebridge.hap
    const { topic, name } = device

    const uuid = homebridge.hap.uuid.generate(platformName + "." + topic)

    this.device = device
    this.homebridge = homebridge

    this.accessory = accessory ?? new this.homebridge.platformAccessory(name, uuid)
    this.accessory.context.topic = topic
    this.accessory.displayName = name

    homebridge.updatePlatformAccessories

    this.accessory
      .getService(Service.AccessoryInformation)
      ?.setCharacteristic(Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(Characteristic.SerialNumber, topic)
      .setCharacteristic(Characteristic.FirmwareRevision, "Unknown")

    this.service =
      this.accessory.getService(Service.WindowCovering) ||
      this.accessory.addService(Service.WindowCovering)

    this.service
      .getCharacteristic(Characteristic.CurrentPosition)
      .onGet(() => this.getCurrentPosition())

    this.service
      .getCharacteristic(Characteristic.PositionState)
      .onGet(() => this.getPositionState())

    this.service
      .getCharacteristic(Characteristic.TargetPosition)
      .onGet(() => this.getTargetPosition())
      .onSet((value: CharacteristicValue) => this.setTargetPosition(value))

    this.device.on(DeviceEvent.POSITION_CHANGE, () => this.handleCurrentPositionChange())
    this.device.on(DeviceEvent.STATE_CHANGE, () => this.handlePositionStateChange())
  }

  static getAccessory(args: ConstructorArgs): PlatformAccessory<AccessoryContext> {
    return new Accessory(args).accessory
  }

  private getCurrentPosition(): number {
    return this.device.getPosition()
  }

  private handleCurrentPositionChange(): void {
    const { Characteristic } = this.homebridge.hap
    const value = this.getCurrentPosition()

    this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(value)
  }

  private getPositionState() {
    const { Characteristic } = this.homebridge.hap
    const value = this.device.getState()
    const states = {
      [DeviceState.DECREASING]: Characteristic.PositionState.DECREASING,
      [DeviceState.INCREASING]: Characteristic.PositionState.INCREASING,
      [DeviceState.STOPPED]: Characteristic.PositionState.STOPPED,
    }

    return states[value] ?? Characteristic.PositionState.STOPPED
  }

  private handlePositionStateChange() {
    const { Characteristic } = this.homebridge.hap
    const value = this.getPositionState()

    this.service.getCharacteristic(Characteristic.PositionState).updateValue(value)
  }

  private getTargetPosition(): number {
    return this.position
  }

  private async setTargetPosition(value: CharacteristicValue) {
    this.position = value as number
    this.device.setPosition(value as number)
  }
}
