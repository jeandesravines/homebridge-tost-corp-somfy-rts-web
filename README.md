# Homebridge TOST Corp Somfy RTS Web

An **unofficial** Homebridge plugin to easily control your Somfy blinds using the TOST Corp box for Somfy RTS.

## Requirements

- A [TOST Corp box for Somfy RTS](https://www.tostcorp.com/boxsomfyrts)


## Installation

```bash
sudo npm install -g @jdes/homebridge-tost-corp-somfy-rts-web
```

## Configuration

### TOST Corp configuration

This plugin uses the TOST Corp's configuration to work.  
So, you have to complete [the TOST Corp's tutorial](https://www.tostcorp.com/plug-and-play) and specify all your Somfy devices with their topics and names.

### Homebridge Configuration

In the Homebridge's `config.json` file, add a new  `TOSTCorpSomfyRTSWeb` platform (in the existing `platforms` node) to specify your TOST Corp Device ID with the key `id`.

```json
{
  "platforms": [
    {
      "platform": "TOSTCorpSomfyRTSWeb",
      "id": "<your_device_id>"
    }
  ]
}
```

**Warning**: After saving the configuration, you have to restart the Homebridge server to let the plugin automatically discover all your Somfy devices.

## Special thanks

A special thanks to [Homebridge](https://github.com/homebridge/homebridge) for making this possible.