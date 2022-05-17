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
  private targetPosition = configuration.somfy.initialPosition

  public readonly accessory: PlatformAccessory<AccessoryContext>

  constructor(args: ConstructorArgs) {
    const { homebridge, device, accessory } = args
    const { Service, Characteristic } = homebridge.hap
    const { topic } = device
    const { platformName } = configuration.platform
    const uuid = homebridge.hap.uuid.generate(platformName + "." + topic)
    const name = accessory?.displayName || device.name

    this.device = device
    this.homebridge = homebridge
    this.accessory = accessory ?? new homebridge.platformAccessory(name, uuid)
    this.accessory.context.topic = this.device.topic

    this.accessory
      .getService(Service.AccessoryInformation)
      ?.setCharacteristic(Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(Characteristic.SerialNumber, "Unknown")
      .setCharacteristic(Characteristic.Model, "RTS Compatible")
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

  private getCurrentPosition(): number {
    this.device.touch()

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
    return this.targetPosition
  }

  private async setTargetPosition(value: CharacteristicValue) {
    this.targetPosition = value as number
    this.device.setPosition(value as number)
  }
}
