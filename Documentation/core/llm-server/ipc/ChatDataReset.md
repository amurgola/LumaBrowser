# ChatDataReset

`core/llm-server/ipc/ChatDataReset.js`

Setup > Advanced > Data "clear conversations and artifacts".

## Methods

- `new ChatDataReset({ deps, spill?, trace? })`; `deps` is [LlmIpcDeps](LlmIpcDeps.md)
  (`db`, `dashboardService`, the agent deps' artifact store, `emitSchedTasksEvent`).
- `wipe()` returns [ChatDataWipe](../chat/ChatDataWipe.md)'s `{ deleted, files }` after
  the wipe, then emits `tasks-changed {}` and deletes the app-owned spill and trace
  trees (a failure there is ignored).

## Why

Database only: no chat-mode disk hooks run, so Code mode's project folders, and
spills inside them, are untouched.
