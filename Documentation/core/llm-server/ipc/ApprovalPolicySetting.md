# ApprovalPolicySetting

`core/llm-server/ipc/ApprovalPolicySetting.js`

The stored tool approval policy (see [ApprovalGate](../chat/ApprovalGate.md)).

## Methods

- `new ApprovalPolicySetting(settingsDb)`.
- `get()` `{ policy }`, normalised.
- `set(policy)` stores and returns `{ policy }`, normalised.
- `ApprovalPolicySetting.normalize(value)` `ask` and `never` are kept; anything else is `auto`.
- `KEY` (`core.llmServer.chat.approvalPolicy`), `DEFAULT` (`auto`).

## Why

`auto` asks where somebody can answer and runs unattended elsewhere, `ask`
always asks, `never` runs every enabled tool at once. Read live at each run.
