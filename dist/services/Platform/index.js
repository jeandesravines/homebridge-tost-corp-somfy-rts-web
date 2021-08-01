"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const configuration = require("../../configuration");
const Accessory_1 = require("../Accessory");
const ApiClient_1 = require("../ApiClient");
const Device_1 = require("../Device");
class Platform {
    logger;
    config;
    homebridge;
    accessories = [];
    pluginName = configuration.platform.pluginName;
    platformName = configuration.platform.platformName;
    constructor(logger, config, homebridge) {
        this.logger = logger;
        this.config = config;
        this.homebridge = homebridge;
        this.homebridge.on("didFinishLaunching", () => {
            this.syncAccessories();
        });
    }
    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }
    async syncAccessories() {
        const { id } = this.config;
        const api = new ApiClient_1.default({ id });
        const devices = await api.getDevices();
        const { pluginName, platformName } = this;
        const accessories = devices.map((informations) => {
            const { name, topic } = informations;
            const device = new Device_1.default({ api, name, topic });
            const existing = this.accessories.find(({ context }) => {
                return context.topic === topic;
            });
            const accessory = new Accessory_1.default({
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
            this.accessories.splice(this.accessories.findIndex((accessory) => {
                return accessory.context.topic === context.topic;
            }));
        }
    }
}
exports.default = Platform;
//# sourceMappingURL=index.js.map