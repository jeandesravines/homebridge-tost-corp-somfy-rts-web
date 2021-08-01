"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
            this.removeAccessories();
            this.addAccessories();
        });
    }
    configureAccessory(accessory) {
        this.accessories.push(accessory);
    }
    async addAccessories() {
        const { id } = this.config;
        const api = new ApiClient_1.default({ id });
        const devices = await api.getDevices();
        const { pluginName, platformName } = this;
        const accessories = devices.map((informations) => {
            const { name, topic } = informations;
            const device = new Device_1.default({ api, name, topic });
            const accessory = new Accessory_1.default({
                device,
                homebridge: this.homebridge,
            });
            return accessory.accessory;
        });
        this.homebridge.registerPlatformAccessories(pluginName, platformName, accessories);
    }
    removeAccessories() {
        this.homebridge.unregisterPlatformAccessories(this.pluginName, this.platformName, this.accessories);
        this.accessories.splice(0);
    }
}
exports.default = Platform;
//# sourceMappingURL=index.js.map