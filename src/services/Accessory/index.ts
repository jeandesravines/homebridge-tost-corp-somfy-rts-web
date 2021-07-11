import { API, CharacteristicValue, PlatformAccessory, Service } from "homebridge";
import * as configuration from "../../configuration";
import Device from "../Device";
import { DeviceEvent, DeviceState } from "../Device/types";

interface ConstructorArgs {
  device: Device;
  homebridge: API;
}

export default class Accessory {
  private readonly service: Service;
  private readonly device: Device;
  private readonly homebridge: API;
  private targetPosition = 100;

  public readonly accessory: PlatformAccessory;

  constructor(args: ConstructorArgs) {
    const { homebridge, device } = args;
    const { Service, Characteristic } = homebridge.hap;
    const { name, topic } = device;
    const { platformName } = configuration.platform;
    const uuid = homebridge.hap.uuid.generate(platformName + "." + topic);

    this.accessory = new homebridge.platformAccessory(name, uuid);
    this.device = device;
    this.homebridge = homebridge;

    this.accessory
      .getService(Service.AccessoryInformation)
      ?.setCharacteristic(Characteristic.Manufacturer, "Somfy")
      .setCharacteristic(Characteristic.SerialNumber, "Unknown")
      .setCharacteristic(Characteristic.Model, "RTS Compatible")
      .setCharacteristic(Characteristic.FirmwareRevision, "Unknown");

    this.service =
      this.accessory.getService(Service.WindowCovering) ||
      this.accessory.addService(Service.WindowCovering);

    this.service
      .getCharacteristic(Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.service
      .getCharacteristic(Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    this.service
      .getCharacteristic(Characteristic.TargetPosition)
      .onGet(this.getTargetPosition.bind(this))
      .onSet(this.setTargetPosition.bind(this));

    this.device.on(DeviceEvent.POSITION_CHANGE, this.handleCurrentPositionChange.bind(this));
    this.device.on(DeviceEvent.STATE_CHANGE, this.handlePositionStateChange.bind(this));
  }

  private getCurrentPosition(): number {
    return this.device.getPosition();
  }

  private handleCurrentPositionChange() {
    const { Characteristic } = this.homebridge.hap;
    const value = this.getCurrentPosition();

    this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(value);
  }

  private getPositionState() {
    const { Characteristic } = this.homebridge.hap;
    const value = this.device.getState();
    const states = {
      [DeviceState.DECREASING]: Characteristic.PositionState.DECREASING,
      [DeviceState.INCREASING]: Characteristic.PositionState.INCREASING,
      [DeviceState.STOPPED]: Characteristic.PositionState.STOPPED,
    };

    return states[value] || Characteristic.PositionState.STOPPED;
  }

  private handlePositionStateChange() {
    const { Characteristic } = this.homebridge.hap;
    const value = this.getPositionState();

    this.service.getCharacteristic(Characteristic.PositionState).updateValue(value);
  }

  private getTargetPosition(): number {
    return this.targetPosition;
  }

  private setTargetPosition(value: CharacteristicValue) {
    this.targetPosition = value as number;
    this.device.setPosition(value as number);
  }
}
