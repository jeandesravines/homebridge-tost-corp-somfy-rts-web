export enum DeviceState {
  INCREASING = "INCREASING",
  DECREASING = "DECREASING",
  STOPPED = "STOPPED",
}

export enum DeviceEvent {
  POSITION_CHANGE = "POSITION_CHANGE",
  STATE_CHANGE = "STATE_CHANGE",
}

export interface DeviceEventPositionChange {
  value: number
}

export interface DeviceEventStateChange {
  value: DeviceState
}
