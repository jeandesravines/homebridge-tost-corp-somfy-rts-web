import { EventEmitter } from "events";
import * as configuration from "../../configuration";
import ApiClient from "../ApiClient";
import { DeviceEvent, DeviceState } from "./types";

interface DeviceConstructorArgs {
  api: ApiClient;
  name: string;
  topic: string;
}

export default class Device extends EventEmitter {
  public readonly name: string;
  public readonly topic: string;
  private readonly api: ApiClient;

  private position = 100;
  private state = DeviceState.STOPPED;
  private updateTimeout?: NodeJS.Timer;
  private updateResolver?: () => void;

  constructor(args: DeviceConstructorArgs) {
    super();

    this.api = args.api;
    this.name = args.name;
    this.topic = args.topic;
  }

  public getPosition(): number {
    return this.position;
  }

  public getState(): DeviceState {
    return this.state;
  }

  public async setPosition(position: number): Promise<void> {
    this.log(`setPosition: from ${this.position} to ${position}`);

    this.cancelUpdate();

    const difference = position - this.position;
    const duration = Math.abs(configuration.somfy.duration * (difference / 100));
    let handler;

    if (position === 0) {
      handler = this.down;
    } else if (position === 100) {
      handler = this.up;
    } else {
      handler = difference > 0 ? this.up : this.down;
    }

    const updatePosition = async () => {
      return new Promise<void>((resolve) => {
        this.updateResolver = resolve;
        this.updateTimeout = setTimeout(() => {
          Promise.resolve()
            .then(() => this.handlePositionChange(position))
            .then(() => this.stop)
            .then(() => resolve());
        }, duration);
      });
    };

    await handler.apply(this);
    await updatePosition();
  }

  public async up(): Promise<void> {
    this.log("action: up");

    await this.api.action({
      action: "up",
      topic: this.topic,
    });

    this.handleStateChange(DeviceState.INCREASING);
  }

  public async down(): Promise<void> {
    this.log("action: down");

    await this.api.action({
      action: "down",
      topic: this.topic,
    });

    this.handleStateChange(DeviceState.DECREASING);
  }

  public async stop(): Promise<void> {
    this.log("action: stop");

    if (this.position > 0 && this.position < 100) {
      await this.api.action({
        action: "stop",
        topic: this.topic,
      });
    }

    this.handleStateChange(DeviceState.STOPPED);
  }

  private cancelUpdate(): void {
    clearTimeout(this.updateTimeout as NodeJS.Timer);
    this.updateResolver?.();
  }

  private handlePositionChange(value: number) {
    this.log(`positionChange`, value);

    this.position = value;
    this.emit(DeviceEvent.POSITION_CHANGE, { value });
  }

  private handleStateChange(value: DeviceState) {
    this.log(`stateChange`, value);

    this.state = value;
    this.emit(DeviceEvent.STATE_CHANGE, { value });
  }

  private log(...parameters: unknown[]): void {
    console.info(`[${this.topic}]:`, ...parameters);
  }
}
