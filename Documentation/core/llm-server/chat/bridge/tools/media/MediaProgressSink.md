# MediaProgressSink

`core/llm-server/chat/bridge/tools/media/MediaProgressSink.js`

The `send` callback a media router reports through during a chat tool call.

## Methods

- `new MediaProgressSink({ tool, hooks, isAborted, progress = 'steps' })`;
  `send(type, payload)` (bound), `lastError`, `reachedServer`.
  - `status` -> `onStatus({ phase, tool })`; `progress` -> `onToolEvent({
    phase: 'status', tool, step, totalSteps })` (or `elapsedMs` for
    `progress: 'elapsed'`); `error` -> `lastError`. Dropped after a Stop.
  - `reachedServer` turns true on the first `status` with a phase other than
    `REMOTE_PHASE` (`'remote'`, the opener a remote run sends before the peer
    did anything): starting the server, switching the model, rendering. Read by
    [MediaRenderOutcome](MediaRenderOutcome.md) to tell a server failure from
    a refused request.

## Why

`reachedServer` (ISSUES.md entry 12): the image and video routers refuse a
request they can tell is wrong before any server phase, and send a phase before
every launch and every render, so the phases seen are the cheapest honest
signal of where a failure happened without changing the routers.
