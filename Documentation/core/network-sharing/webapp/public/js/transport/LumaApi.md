# LumaApi

`core/network-sharing/webapp/public/js/transport/LumaApi.js`

The web client's transport, published as `window.LumaAPI`: the web counterpart
of the desktop preload, on `fetch` against the host's same-origin, PIN-gated
`/sharing` API. A facade over [PairingToken](PairingToken.md),
[HostHttp](HostHttp.md), [HostApi](HostApi.md), [ChatStream](ChatStream.md),
[ImageStream](ImageStream.md) and [VoiceApi](VoiceApi.md). See
[WebClient](../../WebClient.md).

## Methods

- `new LumaApi({ win = window, fetch?, storage?, cryptoImpl? })`: `win`
  supplies `fetch`, `localStorage`, `document`, `navigator` and `crypto` unless
  overridden. Syncs the token cookie once. Every method in `PUBLIC_METHODS` is
  bound (callers may call them detached, as with legacy's plain object).
- Token: `getToken()`, `setToken(t)`, `getHostName()`, `setHostName(n)`.
- Host: `info()`, `pair(pin)`, `listModels()`, `hostCapabilities()`,
  `listAgents()`, `listChatModes()`, `fetchArtifact(id)`.
- Streams: `chat(opts)`, `generateImage(opts)`.
- Voice: `voiceStatus()`, `voicePrewarm()`, `voiceTranscribe(wav, opts)`,
  `voiceSynthesize(opts)`.
- `authedFetch(input, init)`: fetch with the bearer.
- `Unauthorized`: the [Unauthorized](Unauthorized.md) class (legacy exposed it).

## Globals

Reads `window.fetch`, `localStorage`, `document.cookie`, `navigator.userAgent`,
`crypto` (through `win`). Published as `window.LumaAPI` by [WebApp](../web/WebApp.md).
