# TabShareTransport

`extensions/tab-share/TabShareTransport.js`

Tab Share's optimized-stream plumbing: the lazily created
[RtcCapturer](RtcCapturer.md), the [TurnRelay](TurnRelay.md), per-guest ICE
config and the hooks a [TabStreamer](TabStreamer.md) uses for one share.

## Methods

- `new TabShareTransport({ settings, getHost, getTvm, log, extensionDir, rtcCapturer, turnRelay })`.
- `startRelayIfEnabled(onStarted)`: boot-time relay start when it was left on.
- `applyRelay()`: start (or restart on the new port) or stop to match the
  settings; resolves the relay outcome.
- `rtcAvailable()`: the setting is on and the capturer can run.
- `turnHost()`: the configured host, else the web backend's public URL host,
  else `host.lanAddress()`, else `127.0.0.1`.
- `status()` -> `{ enabled, available, error, turn: { enabled, host, running, port, error, supported } }`.
- `hooksFor(share)` -> `{ available(), createPeer(send) }`. Each peer gets a
  `<shareId>:<seq>` key; relay credentials are issued only while the relay is
  on and running, and revoked when the peer closes or fails to start.
- `release(tabId)`, `destroy()`.
