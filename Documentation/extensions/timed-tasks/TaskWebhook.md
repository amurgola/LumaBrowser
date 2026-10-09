# TaskWebhook

`extensions/timed-tasks/TaskWebhook.js`

Posts a completed run to the task's webhook.

## Methods

- `new TaskWebhook({ post? })`: `post` defaults to `axios.post`.
- `send(task, { runId, finalResponse, completedAt })`: posts JSON with a 10 s
  timeout; rejects on any error.
- `TaskWebhook.payloadFor(task, ...)`: `{ taskId, taskName, runId,
  requestPrompt, response (parsed JSON or text), responseText, timestamp }`.
