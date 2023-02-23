import fetch from "node-fetch"
import * as configuration from "../../configuration"

interface ApiClientConstructorArgs {
  id: string
}

interface ApiClientActionArgs {
  action: "up" | "down" | "stop"
  topic: string
}

export default class ApiClient {
  private readonly id: string

  constructor(args: ApiClientConstructorArgs) {
    this.id = args.id
  }

  public async action(args: ApiClientActionArgs): Promise<void> {
    const { action, topic } = args
    const { url, path, service } = configuration.api
    const mapping: Record<typeof action, string> = { up: "u", down: "d", stop: "s" }

    const params = new URLSearchParams({
      device_id: this.id,
      topic,
      command: mapping[action],
      service,
    })

    await fetch(`${url}${path}?${params}`)
  }
}
