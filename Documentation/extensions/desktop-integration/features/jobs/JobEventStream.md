# JobEventStream

`extensions/desktop-integration/features/jobs/JobEventStream.js`

Serves `GET /api/desktop/jobs/stream` as Server-Sent Events.

- `handle(req, res)`: sets `text/event-stream` headers (no cache, no
  buffering, socket timeout off), writes `retry: 5000`, then
  `event: snapshot` with `{ success: true, active, recent }`, and keeps the
  response open. Registry changes go out as `event: job` with the job. A closed
  request or response drops the client.
- A heartbeat comment (`: heartbeat <ms>`) every 15 s (`HEARTBEAT_MS`), on an
  unref'd timer.
- `close()`: unsubscribes, stops the heartbeat, sends `event: end` with
  `{ reason: 'feature-stopped' }` to every client and ends the responses. After
  that `handle` answers `404 Feature disabled` (a request racing the switch).
- `size`: open clients.
- `JobEventStream.frame(event, data)` builds one SSE frame.

The feature's `dispose()` calls `close()`, so switching the feature off or
deactivating the extension never leaves a hanging stream.
