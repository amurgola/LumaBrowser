# ModeReaction

`core/llm-server/chat/router/ModeReaction.js`

Runs a chat mode's optional postProcess reaction after a turn ends.

## Methods

- `new ModeReaction({ chatStore })` (`getMeta`, `setMeta`, `updateMessage`).
- `run(descriptor, { content, conversationId, assistantMessageId, send, aborted = false })`: on a later microtask calls `postProcess({ content, conversationId, assistantMessageId, aborted, meta: getMeta(conversationId), emit(type, payload), setMeta(patch), replaceContent(text) })`. No descriptor or hook is a no-op; failures are logged.
- `replaceContent(text)` stores the rewritten reply (`updateMessage(assistantMessageId, { content })`) and sends `mode:content { messageId, content }` so the renderer re-renders it; false for blank text, a missing id or a store without `updateMessage`. A mode's optional prose polish uses it.

## Why

Generated images, scene changes and partial-work cleanup must never affect the delivered turn.
