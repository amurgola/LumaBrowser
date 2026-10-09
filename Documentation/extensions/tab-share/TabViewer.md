# TabViewer

`extensions/tab-share/TabViewer.js`

One guest connected to a shared tab: its socket, whether it is on the WebRTC
video stream, its peer, and its input rate limit. Every send swallows errors
so a dying socket never throws into the streamer.

## Methods

- `new TabViewer(ws)`; `socket()`.
- `sendJson(obj)`, `sendText(text)`, `sendFrame(jpeg)` (binary), `close(code, reason)`.
- `isBackedUp(frameBytes)`: `bufferedAmount > 3 x frameBytes`.
- `isOnVideo()`, `setOnVideo(on)`; `hasPeer()`, `peer()`, `attachPeer(p)`,
  `detachPeer()` (returns it, unclosed), `closePeer()` (closes it and drops
  back to frames).
- `allowInput(now)`: at most `INPUT_RATE_PER_SEC` (240) input messages per
  wall-clock second.
