# TabStreamer

`extensions/tab-share/TabStreamer.js`

One shared tab's frame feed and input sink, an EventEmitter.

## Methods

- `new TabStreamer({ getWebContents, getView, getFallbackBounds, getMode, getMeta, log, rtc, sleep })`.
  `rtc`: `{ available(), createPeer(send) -> { answer, candidate, close } | null }`.
- `addClient(ws)`: refuses once destroyed or at `MAX_CLIENTS` (8) with
  `{ t:'ended', reason:'ended'|'full' }` and close code 4001. Otherwise sends
  `{ t:'hello', mode, title, url, vw, vh, rtc }`, the last frame meta and
  JPEG, and kicks the loop. Emits `viewers` (count).
- `removeClient(ws)`; `viewerCount`, `videoViewerCount` getters;
  `rtcAvailable()`.
- `broadcastMode()` (`{ t:'mode' }`), `broadcastMeta()` (`{ t:'meta' }`, kicks).
- `destroy(reason)`: every viewer gets `{ t:'ended', reason }` and close code
  4000; emits `viewers` 0; idempotent. `isDestroyed()`.
- `captureOnce()` -> `'sent' | 'same' | 'skip'`. A changed size broadcasts
  `{ t:'frame', w, h, vw, vh }`; an identical JPEG is not re-sent; video
  viewers and backed-up sockets are skipped.
- Loop: `kick()` (capture soon, reset back-off), `stopLoop()`,
  `isLoopScheduled()`. 100 ms while changing, 400 ms after 12 identical
  frames; runs only while some viewer is on frames. A failing capture is
  logged once per streak and backs off.
- `inputSettled()`: resolves when queued input has been sent.

## Message rules (safety)

`ping` -> `pong`; `rtc` signalling is allowed in view mode (it is not input).
Everything else is input and is honoured only when `getMode()` is
`'interact'`, within the per-socket rate limit (240/s), and with a live tab;
otherwise dropped server-side, never trusted to the client. Input is parsed by
[ClientMessageParser](ClientMessageParser.md), mapped by
[InputEventMapper](InputEventMapper.md) against the last frame's view size (or
the live view size before the first frame) and applied by
[TabInputSink](TabInputSink.md).

## WebRTC

`want` creates one peer per viewer (or answers `{ t:'rtc', k:'unavailable' }`);
peer messages are relayed as `{ t:'rtc', ... }`. `answer` / `cand` go to the
peer. `up` (only with a peer) moves the viewer to video and emits `transport`;
the loop stops once nobody is on frames. `down` puts it back on frames. A
host-side `error` or `failed`/`closed` state frees the slot and drops the
viewer back to frames (a peer that ends during creation is closed, not kept).
