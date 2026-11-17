# ConversationJobs

`core/llm-server/chat/jobs/ConversationJobs.js`

The background jobs conversations are waiting on: work a chat tool started that
outlives the turn (a LoRA training run).

## Methods

- `ConversationJobs.shared`: the one instance the chat and extensions use.
- `start({ id, conversationId, kind, title, cancel? })` -> whether the job is tracked. A
  job without a conversation has nobody to tell and is not tracked.
- `update(id, { detail?, step?, totalSteps?, timeLeft? })`: a field left out keeps its
  value; null clears a step count ("not counting yet" is not zero).
- `finish(id, { state: 'done'|'failed'|'canceled', message })`: ends the job. `message`
  is what the conversation is told.
- `cancel(id)` -> whether there was a cancellable job to ask. It calls the owner's own
  `cancel`; the job stays listed until the owner calls `finish`.
- `activeFor(conversationId)` -> views `{ id, conversationId, kind, title, state, detail,
  step, totalSteps, timeLeft, startedAt, cancellable }`.
- `onEvent(listener)` -> unsubscribe. Events: `changed { conversationId, job }` and
  `finished { conversationId, job, message }`. A throwing listener never breaks a job.

## Who listens

- [LlmServerBroadcast](../../ipc/LlmServerBroadcast.md) relays every event to the renderers.
- [ConversationJobPoster](ConversationJobPoster.md) writes the outcome into the thread.
- [AgentTurnDispatch](../router/AgentTurnDispatch.md) reads `activeFor` for the prompt tail
  ([ConversationJobReminder](ConversationJobReminder.md)).

## Why

Before this, nothing in the app updated a visible conversation from the main process
outside a user turn: a long job started from chat ended silently, and the chat model could
claim it had finished or start it again. The registry is in memory only; a job's own
owner (the trainer's job folder) is what survives a restart.
