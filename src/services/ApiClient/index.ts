import axios, { AxiosInstance, AxiosResponse, Method } from "axios";
import { JSDOM } from "jsdom";
import * as configuration from "../../configuration";
import concurrency from "../../helpers/Concurrency";

interface ApiClientConstructorArgs {
  id: string;
}

interface ApiClientQueryArgs {
  method?: Method;
  url?: string;
  data?: Record<string, string | number | null>;
}

interface ApiClientActionArgs {
  action: string;
  topic: string;
}

interface ApiDevice {
  topic: string;
  name: string;
}

export default class ApiClient {
  private readonly deviceId: string;
  private readonly axios: AxiosInstance;
  private sessionId?: string;
  private sessionDate?: number;
  private concurrency = concurrency();

  constructor(args: ApiClientConstructorArgs) {
    this.deviceId = args.id;
    this.axios = axios.create({
      baseURL: configuration.api.url,
    });
  }

  public async action(args: ApiClientActionArgs): Promise<void> {
    const { action, topic } = args;

    await this.init();
    await this.query({
      method: "POST",
      url: configuration.api.paths.server,
      data: {
        [action]: topic,
      },
    });
  }

  private hasValidSession(): boolean {
    if (!this.sessionId || !this.sessionDate) {
      return false;
    }

    return Date.now() - this.sessionDate < configuration.api.sessionTTL;
  }

  async init(): Promise<void> {
    return this.concurrency(async () => {
      if (this.hasValidSession()) {
        return;
      }

      delete this.sessionId;
      delete this.sessionDate;

      const { headers } = await this.query({
        method: "POST",
        url: configuration.api.paths.server,
        data: {
          device_id: this.deviceId,
          check: "Check",
        },
      });

      const cookies = headers?.["set-cookie"]?.[0];
      const sessionId = cookies?.match(/PHPSESSID=(\w+);/)?.[1];

      if (sessionId) {
        this.sessionId = sessionId;
        this.sessionDate = Date.now();
      }

      await this.query({
        method: "POST",
        url: configuration.api.paths.server,
        data: {
          device_id: this.deviceId,
          end_step_one: "Submit",
        },
      });

      await new Promise((resolve) => {
        setTimeout(resolve, configuration.api.validationDuration);
      });
    });
  }

  public async getDevices(): Promise<ApiDevice[]> {
    await this.init();

    const { data } = await this.query({
      method: "GET",
      url: configuration.api.paths.control,
    });

    const dom = new JSDOM(data);
    const { document } = dom.window;

    const selector = ".equipements table tbody tr";
    const rows = Array.from<HTMLElement>(document.querySelectorAll(selector));
    const devices = rows.map((row) => {
      const fields = row.querySelectorAll(".table_field_edit");

      return {
        topic: fields[0]?.textContent as string,
        name: fields[1]?.textContent as string,
      };
    });

    return devices.filter(({ topic }) => {
      return topic;
    });
  }

  private async query(args: ApiClientQueryArgs): Promise<AxiosResponse> {
    const { url, method, data } = args;
    const rawData = new URLSearchParams(data as Record<string, string>).toString();
    const headers: Record<string, string> = {
      Cookie: `device_id=${this.deviceId};`,
    };

    if (this.sessionId) {
      headers.Cookie += ` PHPSESSID=${this.sessionId}`;
    }

    if (method === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    return this.axios.request({
      method,
      url,
      headers,
      data: rawData,
    });
  }
}
