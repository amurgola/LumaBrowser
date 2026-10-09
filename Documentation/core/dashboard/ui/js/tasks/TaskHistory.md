# TaskHistory

`core/dashboard/ui/js/tasks/TaskHistory.js`

The run history modal and a run's transcript modal.

## Methods

- `open(task)`: "Run history: <title>", last `RUN_LIMIT` 30 runs with a status
  dot (`ok`, `run` for running, else `err`), "YYYY-MM-DD HH:MM · status", the
  summary or error, and Transcript when the run has a conversation. "No runs yet."
- `openTranscript(run, task)`: "Run transcript: <title>", "Task prompt" / "Agent"
  rows rendered with [MarkdownRenderer](../../../../llm-server/ui/js/markdown/MarkdownRenderer.md),
  or the escaped error ("Transcript unavailable.").
