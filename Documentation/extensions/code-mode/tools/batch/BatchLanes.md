# BatchLanes

`extensions/code-mode/tools/batch/BatchLanes.js`

Live progress of one fan-out for the chat-ui panel.

## Methods

- `new BatchLanes(tasks, emit)`: one lane `{ id, kind, instruction, status: 'queued' }` per task.
- `publish()` emits `batch:state { lanes }` as a fresh copy (the lanes mutate in place).
- `setStatus(id, status)` then publishes (`running`, `done`, `error`).
- `clear()` emits `batch:state` null. A missing or throwing emit is ignored.
