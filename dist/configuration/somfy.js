"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hours = new Date().getHours();
const isDay = hours >= 6 && hours <= 22;
exports.default = {
    duration: 20_000,
    initialPosition: isDay ? 100 : 0,
};
//# sourceMappingURL=somfy.js.map