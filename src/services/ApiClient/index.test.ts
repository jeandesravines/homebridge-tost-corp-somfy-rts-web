import fetch from "node-fetch"
import ApiClient from "."

function createApiClient() {
  return new ApiClient({ id: "DEVICE_ID" })
}

describe("action", () => {
  test("it should request the API", async () => {
    const client = createApiClient()
    const spyFetch = fetch

    const result = await client.action({
      topic: "my_topic",
      action: "up",
    })

    await client.action({
      topic: "my_topic",
      action: "down",
    })

    await client.action({
      topic: "my_topic",
      action: "stop",
    })

    expect(result).toBeUndefined()

    expect(spyFetch).toHaveBeenNthCalledWith(
      1,
      `https://bipbipavertisseur.alwaysdata.net/somfy_rts/app/app_web_hook.php?device_id=DEVICE_ID&topic=my_topic&command=u&service=send_mqtt_message`
    )

    expect(spyFetch).toHaveBeenNthCalledWith(
      2,
      `https://bipbipavertisseur.alwaysdata.net/somfy_rts/app/app_web_hook.php?device_id=DEVICE_ID&topic=my_topic&command=d&service=send_mqtt_message`
    )

    expect(spyFetch).toHaveBeenNthCalledWith(
      3,
      `https://bipbipavertisseur.alwaysdata.net/somfy_rts/app/app_web_hook.php?device_id=DEVICE_ID&topic=my_topic&command=s&service=send_mqtt_message`
    )
  })
})
