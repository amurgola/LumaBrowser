# LlmServerBroadcast

`core/llm-server/ipc/LlmServerBroadcast.js`

Pushes LLM server events to every live renderer.

## Methods

- `LlmServerBroadcast.wire(runtimeServer)` relays the supervisor's `state-change`
  and `log` events on `core.llmServer.serverEvent` as `{ type, payload }`.
- `LlmServerBroadcast.relayArtifactData(artifactDataStore)` relays the store's
  `change` events on `core.llmServer.artifactData.changed` as `{ rootId, rev, keys }`.
- `LlmServerBroadcast.toAll(channel, message)` sends to every non-destroyed
  webContents; a renderer that throws is skipped.
- `SERVER_EVENT_CHANNEL`, `ARTIFACT_DATA_CHANNEL`.

## Why

Renderers drop artifact-data events whose `rev` is not newer than their cache,
which also mutes the writer's own echo.

## Conversation jobs

`relayConversationJobs(jobs)` sends every [ConversationJobs](../chat/jobs/ConversationJobs.md)
event to all renderers on `core.llmServer.convJobs.event` as `{ type: 'changed' | 'finished', payload }`.
`conversationJobPosted({ conversationId, jobId, messageId })` sends `{ type: 'posted', payload }`
on the same channel once the outcome message is in the thread.
`hostTurnStarting({ conversationId, requestId })` sends `{ type: 'turn', payload }` on the
same channel when the app is about to start a chat turn by itself (a background task's
results). Ids only: a page that wants the turn asks for its stream
([HostTurnFollowers](HostTurnFollowers.md)), so the conversation's text goes to the pages
that follow it and no others.

## Defaults changes

`LlmServerBroadcast.relayDefaults(llmServerService)` (wired beside `wire` in LlmServerIpcHandlers) sends every change of the launch defaults to all renderers on the server event channel as `{ type: 'defaults-changed', payload: { defaults } }`. The Setup page's Defaults card redraws on it. The other subscribers of the channel act only on the types they know.
