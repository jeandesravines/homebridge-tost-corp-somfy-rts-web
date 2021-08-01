"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const jsdom_1 = require("jsdom");
const configuration = require("../../configuration");
const Concurrency_1 = require("../../helpers/Concurrency");
class ApiClient {
    deviceId;
    axios;
    sessionId;
    sessionDate;
    concurrency = Concurrency_1.default();
    constructor(args) {
        this.deviceId = args.id;
        this.axios = axios_1.default.create({
            baseURL: configuration.api.url,
        });
    }
    async action(args) {
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
    hasValidSession() {
        if (!this.sessionId || !this.sessionDate) {
            return false;
        }
        return Date.now() - this.sessionDate < configuration.api.sessionTTL;
    }
    async init() {
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
            const cookies = headers["set-cookie"]?.[0];
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
            await new Promise((resolve) => setTimeout(resolve, configuration.api.validationDuration));
        });
    }
    async getDevices() {
        await this.init();
        const { data } = await this.query({
            method: "GET",
            url: configuration.api.paths.control,
        });
        const dom = new jsdom_1.JSDOM(data);
        const { document } = dom.window;
        const selector = ".equipements table tr:not(:first-child):not(:last-child)";
        const rows = [...document.querySelectorAll(selector)];
        return rows.map((row) => {
            const fields = row.querySelectorAll(".table_field_edit");
            return {
                topic: fields[0].textContent,
                name: fields[1].textContent,
            };
        });
    }
    async query(args) {
        const { url, method, data } = args;
        const rawData = new URLSearchParams(data).toString();
        const headers = {
            Cookie: `device_id=${this.deviceId};`,
        };
        if (this.sessionId) {
            headers.Cookie += ` PHPSESSID=${this.sessionId}`;
        }
        if (method === "POST") {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        return this.axios({
            method,
            url,
            headers,
            data: rawData,
        });
    }
}
exports.default = ApiClient;
//# sourceMappingURL=index.js.map