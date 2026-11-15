# PtySessionTable

`core/terminal/host/PtySessionTable.js`

The live sessions of the host process, by id, and the one place a request from the main process becomes a call on a
[PtySession](PtySession.md). At most 24 sessions: a full table gives an exited session's place to a new one and
refuses when every shell is alive.

## Methods

- `new PtySessionTable({ pty, xterm, emit })`.
- `handle(method, params)`: `open`, `list`, `close`, `snapshot`, `info`, `run`, `read`, `send`. A throw is the reply's
  error.
- `post(method, params)`: `write`, `resize`, `ack`, `viewed`. Unknown sessions and methods are ignored.
- `shutdown()`.
