import CancelablePromise from "cancelable-promise"
import { EventEmitter } from "events"
import * as _ from "lodash"
import * as configuration from "../../configuration"
import logger from "../../helpers/Logger"
import ApiClient from "../ApiClient"
import { DeviceEvent, DeviceState } from "./types"

interface DeviceConstructorArgs {
  api: ApiClient
  name: string
  topic: string
  duration?: number
  delta?: number
}

export default class Device extends EventEmitter {
  public readonly name: string
  public readonly topic: string
  public readonly duration: number
  public readonly delta: number
  private readonly api: ApiClient

  private percent = 1
  private state = DeviceState.STOPPED
  private updateDeferred?: CancelablePromise

  constructor(args: DeviceConstructorArgs) {
    super()

    this.api = args.api
    this.name = args.name
    this.topic = args.topic
    this.duration = args.duration ?? configuration.somfy.defaultDuration
    this.delta = args.delta ?? configuration.somfy.defaultDelta
  }

  public getPosition(): number {
    const { delta, percent } = this
    const value = percent === 0 || percent === 1 ? percent : Math.min(0.01, percent - delta)

    return value * 100
  }

  public getState(): DeviceState {
    return this.state
  }

  public touch(): void {
    this.api.init().catch((error) => {
      this.log("error", error)
    })
  }

  public async setPosition(position: number): Promise<void> {
    const currentPosition = this.getPosition()

    this.log("info", `setPosition: from ${currentPosition} to ${position}`)
    this.cancelUpdate()

    const difference = position - currentPosition
    const ms = 1000

    let handler: () => Promise<void>

    if (position === 0) {
      handler = this.down
    } else if (position === 100) {
      handler = this.up
    } else if (difference !== 0) {
      handler = difference > 0 ? this.up : this.down
    } else {
      return
    }

    if (difference === 0) {
      return handler.apply(this)
    }

    const deferred: CancelablePromise = (this.updateDeferred = new CancelablePromise<void>(
      async (resolve: () => void) => {
        await handler.apply(this)

        const interval = setInterval(async () => {
          if (deferred.isCanceled()) {
            clearInterval(interval)
            resolve()

            return
          }

          this.handlePositionChange(nextPosition)

          const currentPosition = this.getPosition()
          const isEnded =
            isCanceled ||
            (currentPosition <= position && difference < 0) ||
            (currentPosition >= position && difference > 0)
        }, ms)
      }
    ))

    await deferred.then(async () => {
      if (!deferred.isCanceled()) {
        await this.handlePositionChange(position)
        await this.stop()
      }
    })
  }

  public async up(): Promise<void> {
    this.log("info", "action: up")
    this.handleStateChange(DeviceState.INCREASING)

    await this.api.action({
      action: "up",
      topic: this.topic,
    })
  }

  public async down(): Promise<void> {
    this.log("info", "action: down")
    this.handleStateChange(DeviceState.DECREASING)

    await this.api.action({
      action: "down",
      topic: this.topic,
    })
  }

  public async stop(): Promise<void> {
    this.handleStateChange(DeviceState.STOPPED)

    if (this.position > 0 && this.position < 100) {
      this.log("info", "action: stop")

      await this.api.action({
        action: "stop",
        topic: this.topic,
      })
    }
  }

  private cancelUpdate(): void {
    this.updateDeferred?.cancel()
  }

  private handlePositionChange(value: number) {
    this.position = _.clamp(Math.round(value), 0, 100)

    this.log("info", "positionChange", this.position)
    this.emit(DeviceEvent.POSITION_CHANGE, { value: this.position })
  }

  private handleStateChange(value: DeviceState): void {
    this.state = value

    this.log("info", "stateChange", value)
    this.emit(DeviceEvent.STATE_CHANGE, { value })
  }

  private log(level: "info" | "error", ...parameters: unknown[]): void {
    logger[level](`[${this.topic}]:`, ...parameters)
  }
}
