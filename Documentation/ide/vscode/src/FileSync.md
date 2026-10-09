# FileSync

`ide/vscode/src/FileSync.js`

The editor side of a file-touching tool step: pre-write snapshots (served under `luma-before:` for the diff editor, 40 kept), open after write, diff, open at line, insert at caret.

## Methods

- `new FileSync(getRoot)`; `resolve(root, p)`, `snapshot(root, p)`, `afterWrite(root, p, open)`, `showDiff(root, p)`,
  `openFile(root, p, line)`, `insertAtCaret(text)`, `beforeProvider`.
- `FileSync.key(abs)` (case-folded on Windows), `FileSync.BEFORE_SCHEME`, `FileSync.MAX_SNAPSHOTS`.
