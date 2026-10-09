# AgentNotices

`core/shared/AgentNotices.js` (with `core/shared/AgentNoticeRun.js`)

Per-conversation queue of background events (a detached shell command exiting)
waiting to be told to the model on the next agent step.

## Methods

AgentNotices (static, process-wide state):

- `enqueue(conversationId, text)` queues one already formatted notice. Blank
  text is ignored. Null, empty or whitespace ids share an untagged queue. Each
  queue keeps only the newest `MAX_PER_CONVERSATION` (50).
- `drain(conversationId)` takes and clears a conversation's notices, oldest first.
- `drainAll()` takes and clears every conversation's notices.
- `pending(conversationId?)` counts one conversation's notices, or all of them
  when the id is null or omitted.
- `beginRun({ conversationId })` registers a running agent loop and returns an
  `AgentNoticeRun`. Also evicts runs older than `STALE_RUN_MS` (1 hour).
- `drainIfSoleRun(run)` drains everything only when `run` is the single active run.
- `endRun(run)` unregisters a run.
- `reset()` clears queues and runs (test isolation).

AgentNoticeRun (returned by `beginRun`, see `AgentNoticeRun.md`):

- `drain()` returns the notices this run should relay now.
- `end()` unregisters the run.

## Why

The tool that starts a detached process knows its conversation; the agent loop
drains that conversation's queue right before each model call and appends the
lines to the next model-facing message, so the model learns about the exit
without polling. Notices for a conversation whose run has ended stay queued
(bounded) for its next run.

AgentRunner is currently called without a conversation id. Such a run drains
every queue only while it is the single active run, so a notice can never be
handed to a concurrent sibling. A run that threw before `end()` would pin that
fallback forever, hence the one-hour stale eviction.

Pure in-memory, no I/O, never throws.

## Admission note

Consumers are `core/llm-server/agent/AgentRunner.js` (legacy `extensions/ai-chat/AgentRunner.js`) (drains) and `extensions/code-mode/tools-project.js` (enqueues), which must share one queue, so it passes the admission test.
