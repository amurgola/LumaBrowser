# SseChannel

`core/network-sharing/host/llm/SseChannel.js`

A server-sent-events response that opens its headers on the first frame and
swallows writes to a closed socket.

## Methods

- `new SseChannel(res)`.
- `open()`: once, unless headers are already sent: `text/event-stream`,
  `no-cache, no-transform`, `keep-alive`, then `flushHeaders()`.
- `data(payload)`: `data: <json>` frame. `event(type, payload)`: `event: <type>`
  plus data. `done()`: `data: [DONE]`.
