import { API } from "homebridge";
import * as configuration from "./configuration";
import Platform from "./services/Platform";

export default function (api: API): void {
  api.registerPlatform(
    configuration.platform.pluginName,
    configuration.platform.platformName,
    Platform
  );
}
