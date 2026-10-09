# TimedTaskRunner

`extensions/timed-tasks/TimedTaskRunner.js`

Executes one run of a timed task. Never rejects.

## Methods

- `new TimedTaskRunner({ repository, aiChat, webhook, broadcast, now? })`:
  `aiChat` is the ai-chat extension API.
- `execute(task, { silent = true })`: resolves `{ runId, response, status,
  error }`:
  - already running: `{ runId: null, response: 'Task is already running', status: 'skipped' }`;
  - inserts a `running` run row, sets the task `running` (clearing
    `last_error`), broadcasts `run-started`;
  - `aiChat.run({ prompt, label: name, autoCloseTab: silent, maxIterations: 15,
    timeout: 300000, systemPromptAppend })` with the
    [ResponseFormat](ResponseFormat.md) instruction;
  - stores `response`, `status` (`completed` / `error`), `completed_at` and a
    JSON `conversation_log` (`runId, taskId, taskName, silent, startedAt,
    completedAt, status, tabId, iterations, durationMs, toolCalls, steps,
    systemPrompt, systemPromptAppend, summary, error, finalResponse`);
  - posts the webhook only for a completed run; a failure becomes `Webhook
    failed: <msg>` on the run and the task;
  - a thrown error is stored with its stack in the log;
  - always: task back to `idle`, rescheduled one interval from now when still
    enabled (a task deleted mid-run stays deleted), broadcast `run-finished`.
- `isRunning(taskId)`, `reset()`.
