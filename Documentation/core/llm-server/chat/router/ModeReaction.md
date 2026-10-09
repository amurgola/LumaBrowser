# ModeReaction

`core/llm-server/chat/router/ModeReaction.js`

Runs a chat mode's optional postProcess reaction after a turn ends.

## Methods

- `new ModeReaction({ chatStore })`.
- `run(descriptor, { content, conversationId, assistantMessageId, send, aborted = false })`: on a later microtask calls `postProcess({ content, conversationId, assistantMessageId, aborted, meta: getMeta(conversationId), emit(type, payload), setMeta(patch) })`. No descriptor or hook is a no-op; failures are logged.

## Why

Generated images, scene changes and partial-work cleanup must never affect the delivered turn.
