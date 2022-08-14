# Homebridge TOST Corp Somfy RTS Web

[![Verified by Homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Version](https://badgen.net/npm/v/@jdes/homebridge-tost-corp-somfy-rts-web/latest?icon=npm&label)](https://www.npmjs.com/package/@jdes/homebridge-tost-corp-somfy-rts-web)
[![Downloads](https://badgen.net/npm/dt/@jdes/homebridge-tost-corp-somfy-rts-web/latest?label=downloads)](https://www.npmjs.com/package/@jdes/homebridge-tost-corp-somfy-rts-web)

An Homebridge plugin (**very unofficial**) to easily control your Somfy blinds using the TOST Corp box for Somfy RTS.

## Requirements

- A [TOST Corp box for Somfy RTS](https://www.tostcorp.com/boxsomfyrts)
- A running instance of an Homebridge server

## Installation

```bash
sudo npm install -g @jdes/homebridge-tost-corp-somfy-rts-web
```

## Configuration

### TOST Corp configuration

This plugin uses the TOST Corp's configuration to work.  
So, you have to complete [the TOST Corp's tutorial](https://www.tostcorp.com/plug-and-play) and specify all your Somfy devices with their topics and names.

### Homebridge Configuration

In the Homebridge's `config.json` file, add a new `TOSTCorpSomfyRTSWeb` platform (in the existing `platforms` node) to specify your TOST Corp Device ID with the key named `id`.

#### Basic

```json
{
  "platforms": [
    {
      "platform": "TOSTCorpSomfyRTSWeb",
      "id": "<your_tost_corp_device_id>"
    }
  ]
}
```

#### Advanced (for difference between devices)

```json
{
  "platforms": [
    {
      "platform": "TOSTCorpSomfyRTSWeb",
      "id": "<your_tost_corp_device_id>",
      "devices": [
        {
          "topic": "<accessory_topic_1>",
          "duration": 10000
        },
        {
          "topic": "<accessory_topic_2>",
          "duration": 20000,
          "durationDelta": 2000
        },
        {
          "topic": "<accessory_topic_3>",
          "excluded": true
        }
      ]
    }
  ]
}
```

**Warning**: After saving the configuration, you have to restart the Homebridge server to let the plugin automatically discover all your Somfy devices.

### Configuration Parameters

- `platform`:
  - type: `"TOSTCorpSomfyRTSWeb"`
  - required: `true`
- `id`:
  - type: `string`
  - required: `true`
  - Description: TOST Corp device's ID
- `devices`:
  - type: `array`
  - required: `false`
  - description: Accessories to customize
  - items:
    - `topic`:
      - type: `string`
      - required: `true`
      - description: Accessory's topic
    - `duration`:
      - type: `number`
      - required: `false`
      - description: Duration (in milliseconds) of the total opening/closing phase
      - default: `20_000`
    - `durationDelta`:
      - type: `number`
      - required: `false`
      - description: Duration (in milliseconds) of the starting phase
      - default: `2_000`
    - `excluded`:
      - type: `boolean`
      - required: `false`
      - description: true if the device has to be ignore
      - default: `false`

## Contributors

A big thank you to [TheAbstractDev](https://github.com/TheAbstractDev) for initiating the contribution to this repository

## Special thanks

A special thanks to [TOST Corp](https://www.tostcorp.com/boxsomfyrts) for this incredible device and to [Homebridge](https://github.com/homebridge/homebridge) for making this possible.
