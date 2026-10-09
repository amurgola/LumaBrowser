# CodeDecorator

`ide/webview/ui/CodeDecorator.js`

Adds a header with "copy" and "insert" buttons to each rendered code block.

## Methods

- `CodeDecorator.decorate(root, host)`: idempotent; "copy" sends `copy { text }` and shows "copied" for 1.2 s,
  "insert" sends `insert { text }` (at the editor caret).
