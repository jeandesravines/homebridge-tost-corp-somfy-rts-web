"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const configuration = require("./configuration");
const Platform_1 = require("./services/Platform");
function default_1(api) {
    api.registerPlatform(configuration.platform.pluginName, configuration.platform.platformName, Platform_1.default);
}
exports.default = default_1;
//# sourceMappingURL=index.js.map