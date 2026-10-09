# MediaProgressSink

`core/llm-server/chat/bridge/tools/media/MediaProgressSink.js`

The `send` callback a media router reports through during a chat tool call.

## Methods

- `new MediaProgressSink({ tool, hooks, isAborted, progress = 'steps' })`;
  `send(type, payload)` (bound), `lastError`.
  - `status` -> `onStatus({ phase, tool })`; `progress` -> `onToolEvent({
    phase: 'status', tool, step, totalSteps })` (or `elapsedMs` for
    `progress: 'elapsed'`); `error` -> `lastError`. Dropped after a Stop.
