# CodeEditorLayout

`core/llm-server/ui/js/code/CodeEditorLayout.js`

Builds the surface DOM: `.ce-head` (title, status, New file, New folder,
Refresh, Diff, Chat, Save) and `.ce-body` (tree beside tabs, editor, diff and
image hosts).

## Methods

- `CodeEditorLayout.build(root)` returns `{ title, status, tree, tabs, editorHost, imageHost, diffHost, buttons }`.
