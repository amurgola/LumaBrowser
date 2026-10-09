# ApprovalNotifier

`ide/vscode/src/ApprovalNotifier.js`

The editor approval prompt, only while the Luma view is hidden.

## Methods

- `ApprovalNotifier.hook(isViewVisible)`: the session's `approvalPrompt(tool, detail, decide)`; returns a dismiss
  function, or null when the view is visible. Choices: Allow once (`once`), Allow for this run (`run`), Deny (`reject`).
