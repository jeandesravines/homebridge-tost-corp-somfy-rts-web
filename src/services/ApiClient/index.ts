import { JSDOM } from "jsdom"
import * as configuration from "../../configuration"
import concurrency from "../../helpers/Concurrency"

interface ApiClientConstructorArgs {
  id: string
}

interface ApiClientQueryArgs {
  method?: RequestInit["method"]
  path?: string
  data?: Record<string, string | number | null>
}

interface ApiClientActionArgs {
  action: string
  topic: string
}

interface ApiDevice {
  topic: string
  name: string
}

export default class ApiClient {
  private readonly deviceId: string
  private readonly concurrency = concurrency()
  private sessionId?: string
  private sessionDate?: number

  constructor(args: ApiClientConstructorArgs) {
    this.deviceId = args.id
  }

  public async action(args: ApiClientActionArgs): Promise<void> {
    const { action, topic } = args

    await this.init()
    await this.request({
      method: "POST",
      path: configuration.api.paths.server,
      data: {
        [action]: topic,
      },
    })
  }

  private hasValidSession(): boolean {
    if (!this.sessionId || !this.sessionDate) {
      return false
    }

    return Date.now() - this.sessionDate < configuration.api.sessionTTL
  }

  async init(): Promise<void> {
    return this.concurrency(async () => {
      if (this.hasValidSession()) {
        return
      }

      delete this.sessionId
      delete this.sessionDate

      const { headers } = await this.request({
        method: "GET",
        path: configuration.api.paths.control,
      })

      const cookies = headers.get("set-cookie")
      const sessionId = cookies?.match(/PHPSESSID=(\w+);/)?.[1]

      if (sessionId) {
        this.sessionId = sessionId
        this.sessionDate = Date.now()
      }
    })
  }

  public async getDevices(): Promise<ApiDevice[]> {
    await this.init()

    const path = configuration.api.paths.control
    const response = await this.request({ path })
    const data = await response.text()

    const dom = new JSDOM(data)
    const { document } = dom.window

    const selector = ".equipements .table_field"
    const rows = Array.from<HTMLElement>(document.querySelectorAll(selector))
    const devices = rows.map((row) => {
      const input = row.querySelector("input[type=checkbox][id]")

      return {
        topic: input?.id as string,
        name: row.textContent?.trim() as string,
      }
    })

    return devices.filter(({ topic }) => {
      return topic
    })
  }

  private async request(args: ApiClientQueryArgs): Promise<Response> {
    const { path = "", method = "GET", data } = args

    const params = new URLSearchParams(data as Record<string, string>).toString()
    const headers: Record<string, string> = {
      Cookie: `cookie-consent=1; device_id=${this.deviceId}`,
    }

    if (this.sessionId) {
      headers.Cookie += `; PHPSESSID=${this.sessionId}`
    }

    if (method === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded"
    }

    const isPost = method === "POST"
    const baseUrl = configuration.api.url
    const prefix = /\w+:\/\//.test(path) ? "" : baseUrl
    const query = isPost ? "" : `?${params}`
    const url = prefix + path + query

    return fetch(url, {
      method,
      headers,
      body: isPost ? params : undefined,
    })
  }
}
