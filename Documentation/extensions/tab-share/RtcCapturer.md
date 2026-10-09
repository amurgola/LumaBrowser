# RtcCapturer

`extensions/tab-share/RtcCapturer.js`

Host side of Tab Share's optimized (WebRTC) stream: one RTCPeerConnection per
guest, run in the [CapturerWindow](CapturerWindow.md) page, with signalling
relayed over the guest's WebSocket. One tab is one captured stream shared by
all its peers; captures are granted one at a time by
[CaptureGrantQueue](CaptureGrantQueue.md).

## Methods

- `new RtcCapturer({ getFrameForTab, log, extensionDir, electron })`;
  `electron` is injected by tests, else required on first use.
- `isAvailable()`: not destroyed and no fatal failure. `failure()`: the last
  fatal error message or null. `hasPeer(peerId)`.
- `ensure()`: opens the window once; a failure sets `failure()`, logs
  `capturer unavailable: <msg>` and allows a retry.
- `createPeer({ tabId, iceServers, send })` -> `{ id, answer(sdp), candidate(cand), close() }`
  or null when unavailable. After ready the page gets
  `{ k:'create', peerId, tabId, iceServers: [] }` (the host peer uses host
  candidates only); the guest's `iceServers` ride on the relayed offer.
  `close()` is for a guest that left (no notice).
- `closePeer(peerId, { notify = true })`: tells the guest `state: closed`
  when `notify`, and the page `{ k:'close' }`.
- `release(tabId)`: closes that tab's peers (each told `state: closed`) and
  sends `{ k:'release', tabId }`.
- `destroy()`: errors every peer with `ended`, closes the window; no failure
  recorded.

Page messages: `ready`, `capture-request`, `capture-done`, `log`; `offer`,
`cand`, `state`, `error` are relayed to the peer's guest without `peerId`
(`failed`/`closed` state also closes the peer). A closed window records
`capturer window closed` and errors peers with `capturer-closed`; a gone
renderer records `capturer renderer gone (<reason>)` and `capturer-gone`.
