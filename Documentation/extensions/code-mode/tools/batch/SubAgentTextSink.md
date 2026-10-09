# SubAgentTextSink

`extensions/code-mode/tools/batch/SubAgentTextSink.js`

The bridge hooks of one batch sub-agent run.

## Methods

- `hooks`: the full AgentChatBridge hook set; `onDelta` accumulates,
  `onContentRollback(chars)` removes retracted tool JSON, `onError` records the
  message; the rest are no-ops.
- `text()`, `error()`, `setError(message)` (keeps an error the hooks already reported).
