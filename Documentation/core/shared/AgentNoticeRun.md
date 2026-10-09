# AgentNoticeRun

`core/shared/AgentNoticeRun.js`

Handle for one registered agent run, created by `AgentNotices.beginRun`.

## Methods

- `drain()` returns the notices this run should relay now: its own
  conversation's when it has an id, otherwise every queue but only while it is
  the single active run (`AgentNotices.drainIfSoleRun`).
- `end()` unregisters the run (`AgentNotices.endRun`).
- `conversationId` (string or null) and `startedAt` (ms) are readable fields;
  `startedAt` drives the one-hour stale eviction in `AgentNotices`.
