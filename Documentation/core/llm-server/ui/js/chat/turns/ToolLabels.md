# ToolLabels

`core/llm-server/ui/js/chat/turns/ToolLabels.js`

Human labels for agent tool steps: settled names and the present-continuous
running labels, with a humanized fallback so no step reads as a permanent
"Preparing…".

## Methods

- `ToolLabels.LABEL`, `ToolLabels.RUNNING`. The background-task tools read "Run in
  background" / "Starting a background task…", "Check background tasks" / "Checking
  background tasks…" and "Stop background task" / "Stopping a background task…".
- `ToolLabels.labelOf(tool)`, `ToolLabels.stepLabel(step)`,
  `ToolLabels.humanize(name)`, `ToolLabels.agentStepLabel(tool)`.
- `ToolLabels.batchLabel(steps)`: a batch row's header, "Reading file… (3)"
  when every call is the same tool, else "Running 3 tools…".
