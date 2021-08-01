"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("../../configuration");
const types_1 = require("../Device/types");
class Accessory {
    service;
    device;
    homebridge;
    targetPosition = configuration.somfy.initialPosition;
    accessory;
    constructor(args) {
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
        this.device.on(types_1.DeviceEvent.POSITION_CHANGE, this.handleCurrentPositionChange.bind(this));
        this.device.on(types_1.DeviceEvent.STATE_CHANGE, this.handlePositionStateChange.bind(this));
    }
    getCurrentPosition() {
        return this.device.getPosition();
    }
    handleCurrentPositionChange() {
        const { Characteristic } = this.homebridge.hap;
        const value = this.getCurrentPosition();
        this.service.getCharacteristic(Characteristic.CurrentPosition).updateValue(value);
    }
    getPositionState() {
        const { Characteristic } = this.homebridge.hap;
        const value = this.device.getState();
        const states = {
            [types_1.DeviceState.DECREASING]: Characteristic.PositionState.DECREASING,
            [types_1.DeviceState.INCREASING]: Characteristic.PositionState.INCREASING,
            [types_1.DeviceState.STOPPED]: Characteristic.PositionState.STOPPED,
        };
        return states[value] || Characteristic.PositionState.STOPPED;
    }
    handlePositionStateChange() {
        const { Characteristic } = this.homebridge.hap;
        const value = this.getPositionState();
        this.service.getCharacteristic(Characteristic.PositionState).updateValue(value);
    }
    getTargetPosition() {
        return this.targetPosition;
    }
    async setTargetPosition(value) {
        this.targetPosition = value;
        this.device.setPosition(value);
    }
}
exports.default = Accessory;
//# sourceMappingURL=index.js.map