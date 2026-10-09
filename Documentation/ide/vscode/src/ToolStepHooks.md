# ToolStepHooks

`ide/vscode/src/ToolStepHooks.js`

Editor reactions to `tool` frames: snapshot before a write, refresh/open after a successful one, the editor approval prompt.

## Methods

- `new ToolStepHooks(session)`; `onTool(payload)`; `expireApproval()`. Write tools: `write_file`, `edit_file`.
