# CodeWorkspace

`core/llm-server/ui/js/code/CodeWorkspace.js`

The shared state of the surface for one folder (elements, client, tree,
open files, snapshots, editor, diff) and the repaint helpers.

## Methods

- `isShowing()`, `uriFor(path)` (`file://` URI under the root so TS/JS see one
  project), `setTitle(text)`, `renderTabs()`, `renderTree()`, `updateButtons()`
  (Save / "Save all (n)", Diff live while the active file differs from its
  snapshot), `reset()`, `hideDiff()`; getters `editor`, `monaco`.
