# ApprovalBar

`ide/webview/ui/ApprovalBar.js`

The approval bar: Allow once / Allow for this run / Deny, also on the y, a and n keys (Escape denies).

## Methods

- `new ApprovalBar(container, page)`; `isOpen()`, `show(p)` (from a `tool` frame with phase `approval`), `hide()`,
  `decide(decision)` (sends `approve { decision }`). `lastParams` keeps the last approval's params for a denied row.

## Globals

Adds a `keydown` listener on `document`.
