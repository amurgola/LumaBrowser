# CdpFrameHandler

`extensions/cdp-driver/CdpFrameHandler.js`

Handles one inbound WebSocket frame and sends the reply.

## Methods

- `new CdpFrameHandler(sessions, dispatcher)`.
- `handle(connection, data)`:
  - unparseable JSON -> `{ id: null, error: { code: -32700, message: 'Parse error' } }`;
  - no numeric `id` or no `method` -> `{ id: id || null, error: { code: -32600, message: 'Invalid request' } }`;
  - the session is the frame's `sessionId`, else the connection's implicit one; an
    explicit unknown `sessionId` -> `-32602 Session <id> not found`;
  - otherwise dispatches and replies `{ id, result }` or `{ id, error }`
    ([CdpError](CdpError.md) `serialize`), echoing `sessionId` when the frame had one.
