import { EventEmitter } from "events"
import * as hap from "hap-nodejs"
import { CharacteristicValue } from "hap-nodejs"

interface Characteristic {
  getHandler?: () => CharacteristicValue
  setHandler?: (value: CharacteristicValue) => void
  onGet?: (callback: () => CharacteristicValue) => Characteristic
  onSet?: (callback: (value: CharacteristicValue) => void) => Characteristic
  updateValue: (value: CharacteristicValue) => Characteristic
}

interface Service {
  setCharacteristic: (characteristic: Characteristic) => Service
  getCharacteristic: (key: string) => Characteristic
}

class PlatformAccessory {
  public readonly context: Record<string, unknown> = {}
  public readonly displayName: string
  public readonly UUID: string

  private readonly characteristics: Record<string, Characteristic> = {}
  private readonly service: Service = {
    setCharacteristic: jest.fn().mockReturnThis(),
    getCharacteristic: (key: string) => {
      if (!this.characteristics[key]) {
        this.characteristics[key] = {
          onGet(callback) {
            this["getHandler"] = callback
            return this
          },
          onSet(callback) {
            this["setHandler"] = callback
            return this
          },
          updateValue() {
            return this
          },
        }
      }

      return this.characteristics[key]
    },
  }

  constructor(displayName: string, uuid: string) {
    this.UUID = uuid
    this.displayName = displayName
  }

  getService(): Service {
    return this.service
  }
}

export class HomebridgeAPI extends EventEmitter {
  hap = hap
  platformAccessory = PlatformAccessory

  registerPlatformAccessories(): void {
    return
  }

  unregisterPlatformAccessories(): void {
    return
  }
}
