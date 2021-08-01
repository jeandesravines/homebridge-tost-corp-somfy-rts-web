"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cancelable_promise_1 = require("cancelable-promise");
const events_1 = require("events");
const _ = require("lodash");
const configuration = require("../../configuration");
const types_1 = require("./types");
class Device extends events_1.EventEmitter {
    name;
    topic;
    api;
    position = configuration.somfy.initialPosition;
    state = types_1.DeviceState.STOPPED;
    updateDeferred;
    constructor(args) {
        super();
        this.api = args.api;
        this.name = args.name;
        this.topic = args.topic;
    }
    getPosition() {
        return this.position;
    }
    getState() {
        return this.state;
    }
    async setPosition(position) {
        this.log(`setPosition: from ${this.position} to ${position}`);
        this.cancelUpdate();
        const difference = position - this.position;
        const duration = Math.abs(configuration.somfy.duration * (difference / 100));
        const ms = 1000;
        const increment = Math.floor((difference / duration) * ms) || 0;
        let handler;
        if (position === 0) {
            handler = this.down;
        }
        else if (position === 100) {
            handler = this.up;
        }
        else {
            handler = difference > 0 ? this.up : this.down;
        }
        const deferred = (this.updateDeferred = new cancelable_promise_1.default(async (resolve) => {
            await handler.apply(this);
            if (difference === 0) {
                return resolve();
            }
            const interval = setInterval(() => {
                const nextPosition = this.position + increment;
                const isCanceled = deferred.isCanceled();
                const isEnded = isCanceled ||
                    nextPosition === position ||
                    (nextPosition < position && difference < 0) ||
                    (nextPosition > position && difference > 0);
                if (!isCanceled) {
                    this.handlePositionChange(nextPosition);
                }
                if (isEnded) {
                    if (!isCanceled) {
                        this.stop();
                    }
                    resolve();
                }
            }, ms);
            deferred.then(() => {
                clearInterval(interval);
            });
        }));
        await deferred;
    }
    async up() {
        this.log("action: up");
        await this.api.action({
            action: "up",
            topic: this.topic,
        });
        this.handleStateChange(types_1.DeviceState.INCREASING);
    }
    async down() {
        this.log("action: down");
        await this.api.action({
            action: "down",
            topic: this.topic,
        });
        this.handleStateChange(types_1.DeviceState.DECREASING);
    }
    async stop() {
        if (this.position > 0 && this.position < 100) {
            this.log("action: stop");
            await this.api.action({
                action: "stop",
                topic: this.topic,
            });
        }
        this.handleStateChange(types_1.DeviceState.STOPPED);
    }
    cancelUpdate() {
        this.updateDeferred?.cancel();
    }
    handlePositionChange(value) {
        this.log(`positionChange`, value);
        this.position = _.clamp(Math.round(value), 0, 100);
        this.emit(types_1.DeviceEvent.POSITION_CHANGE, { value: this.position });
    }
    handleStateChange(value) {
        this.log(`stateChange`, value);
        this.state = value;
        this.emit(types_1.DeviceEvent.STATE_CHANGE, { value });
    }
    log(...parameters) {
        console.info(`[${this.topic}]:`, ...parameters);
    }
}
exports.default = Device;
//# sourceMappingURL=index.js.map