import { Logger } from "homebridge/lib/logger"
import * as configuration from "../../configuration"

const { environment } = configuration.app
const { platformName } = configuration.platform

const logger = new Logger(platformName)
const proxy = new Proxy(logger, {
  get: () => {
    return () => undefined
  },
})

export default environment === "test" ? proxy : logger
