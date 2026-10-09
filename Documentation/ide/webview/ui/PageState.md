# PageState

`ide/webview/ui/PageState.js`

What the page knows about its session (pushed by the host as `state` messages) and about the turn in flight.

## Methods

- Fields: `status`, `statusMessage`, `agent`, `model`, `root`, `approval`, `streaming`, `showReasoning`, `suggest`,
  `context`, `agents`, `conversationId`, `resumedMessages`, `ideName`, `turn`.
- `PageState.freshTurn()`: `{ tool, pendingTool, startedAt, lastDecision, followupsQueued, stopping }`.
