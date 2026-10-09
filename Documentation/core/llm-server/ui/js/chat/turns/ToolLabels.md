# ToolLabels

`core/llm-server/ui/js/chat/turns/ToolLabels.js`

Human labels for agent tool steps: settled names and the present-continuous
running labels, with a humanized fallback so no step reads as a permanent
"Preparing…".

## Methods

- `ToolLabels.LABEL`, `ToolLabels.RUNNING`.
- `ToolLabels.labelOf(tool)`, `ToolLabels.stepLabel(step)`,
  `ToolLabels.humanize(name)`, `ToolLabels.agentStepLabel(tool)`.
