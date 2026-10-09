# CdpConnection

`extensions/cdp-driver/CdpConnection.js`

One client WebSocket on the CDP server.

## Methods

- `new CdpConnection(ws, { scope, targetId })`; fields `scope` (`'browser' | 'page'`),
  `scopedTargetId`, `implicitSessionId`, `discoverTargets`, `autoAttach`,
  `waitForDebuggerOnStart`, `flatten` (true).
- `send(frame)`: JSON over the socket only while it is open; a throwing socket is ignored.
- `wantsBroadcast(frame)`: false for `Target.*` frames until discovery is on.
- `eventFrameFor(session, method, params)`: adds `sessionId` unless it is this
  connection's implicit session.
