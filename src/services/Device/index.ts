import CancelablePromise from "cancelable-promise";
import { EventEmitter } from "events";
import * as _ from "lodash";
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

  private position = configuration.somfy.initialPosition;
  private state = DeviceState.STOPPED;
  private updateDeferred?: CancelablePromise;

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

  public touch(): void {
    this.api.init().catch((error) => {
      this.log("error", error);
    });
  }

  public async setPosition(position: number): Promise<void> {
    this.log("info", `setPosition: from ${this.position} to ${position}`);
    this.cancelUpdate();

    const difference = position - this.position;
    const duration = Math.abs(configuration.somfy.duration * (difference / 100));
    const ms = 1000;
    const increment = Math.floor((difference / duration) * ms) || 0;
    let handler: () => Promise<void>;

    if (position === 0) {
      handler = this.down;
    } else if (position === 100) {
      handler = this.up;
    } else if (difference !== 0) {
      handler = difference > 0 ? this.up : this.down;
    }

    const deferred = (this.updateDeferred = new CancelablePromise<void>(
      async (resolve: () => void) => {
        await handler?.apply(this);

        if (difference === 0) {
          return resolve();
        }

        const interval = setInterval(() => {
          const nextPosition = this.position + increment;
          const isCanceled = deferred.isCanceled();
          const isEnded =
            isCanceled ||
            nextPosition === position ||
            (nextPosition < position && difference < 0) ||
            (nextPosition > position && difference > 0);

          if (!isCanceled) {
            this.handlePositionChange(nextPosition);
          }

          if (isEnded) {
            if (!isCanceled) {
              this.stop().catch((error) => {
                this.log("error", error);
              });
            }

            resolve();
          }
        }, ms);

        deferred.then(() => {
          clearInterval(interval);
        });
      }
    ));

    await deferred;
  }

  public async up(): Promise<void> {
    this.log("info", "action: up");
    this.handleStateChange(DeviceState.INCREASING);

    await this.api.action({
      action: "up",
      topic: this.topic,
    });
  }

  public async down(): Promise<void> {
    this.log("info", "action: down");
    this.handleStateChange(DeviceState.DECREASING);

    await this.api.action({
      action: "down",
      topic: this.topic,
    });
  }

  public async stop(): Promise<void> {
    this.handleStateChange(DeviceState.STOPPED);

    if (this.position > 0 && this.position < 100) {
      this.log("info", "action: stop");

      await this.api.action({
        action: "stop",
        topic: this.topic,
      });
    }
  }

  private cancelUpdate(): void {
    this.updateDeferred?.cancel();
  }

  private handlePositionChange(value: number) {
    this.position = _.clamp(Math.round(value), 0, 100);

    this.log("info", "positionChange", this.position);
    this.emit(DeviceEvent.POSITION_CHANGE, { value: this.position });
  }

  private handleStateChange(value: DeviceState): void {
    this.state = value;

    this.log("info", "stateChange", value);
    this.emit(DeviceEvent.STATE_CHANGE, { value });
  }

  private log(level: "info" | "error", ...parameters: unknown[]): void {
    console[level](`[${this.topic}]:`, ...parameters);
  }
}
