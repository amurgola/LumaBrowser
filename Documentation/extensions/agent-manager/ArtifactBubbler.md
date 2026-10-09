# ArtifactBubbler

`extensions/agent-manager/ArtifactBubbler.js`

Brings files a delegated agent creates into the delegating conversation.

## Methods

- `new ArtifactBubbler(chat, getRouter = ExtensionGlobals.chatRouter)`; `chat`
  is the bridge's `opts.chat` (`{ conversationId, assistantMessageId, onArtifact }`)
  or nothing (then every call is a no-op).
- `bubble(artifact)`: re-parents the artifact's version chain with
  `router.getAgentDeps().artifactStore.reparent(id, { conversationId, messageId })`
  (best effort), records it, and hands the enriched object to `chat.onArtifact`.
- `summaries()` -> `[{ id, title, type }]`, one per chain (the highest version).

## Why

The sub-agent runs under a phantom `agent:<id>:<stamp>` conversation; without
this its files existed but were invisible where the user was.
