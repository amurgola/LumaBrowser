# ConversationJobPoster

`core/llm-server/chat/jobs/ConversationJobPoster.js`

Writes a finished background job's outcome into the conversation that started it.

## Methods

- `new ConversationJobPoster({ jobs, getRouter, onPosted, sleep })`: `getRouter()` is the
  chat router (`active`, `chatStore`) or null before it exists.
- `watch()`: listens for `finished` events. Returns an unsubscribe.
- `post({ conversationId, job, message })` -> the stored row, or null when there is no
  message, the conversation is gone or the router is not up. The row is an `assistant`
  message with `provider: 'background-job'`.

## Why an assistant message

The thread is the one place both readers look: the user sees the outcome without asking,
and the model reads it as history on its next turn, across restarts. A queued notice
(AgentNotices) is invisible to the user and lost on restart.

The poster waits while a chat turn is streaming (the router holds one at a time) so the
message never lands inside a reply; after ten minutes it writes regardless.
