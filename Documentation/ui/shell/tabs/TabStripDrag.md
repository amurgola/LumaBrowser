# TabStripDrag

`ui/shell/tabs/TabStripDrag.js`

Dragging tabs on the strip, Chrome-style.

- Within the strip a regular tab reorders live; dropped on the strip, the order is
  committed through [TabOrderCommit](TabOrderCommit.md).
- Dropped off the strip, `tabAPI.dragOut(tabId)` lets main decide by the cursor
  ([TabWindows](../../../app/window/TabWindows.md)): another window's strip, a new
  window, or nothing. When the tab stayed, the live reorder is committed after all.
- A tab dragged over from another window's strip is accepted: the tab under the
  cursor gets `drop-before` / `drop-after` (an accent bar), and the drop calls
  `tabAPI.dropIn(tabId, index)` with the index in main's full order.

The drag carries the tab id under `application/x-luma-tab` only, so a page under
the cursor never takes the drop as text.

## Methods

- `new TabStripDrag({ strip, getApi })` (`getApi` defaults to `() => window.tabAPI`).
- `install()`; `draggingTabId`.
- `TabStripDrag.MIME`, `DROP_BEFORE`, `DROP_AFTER`.

## Globals

Reads `window.tabAPI` (`dragOut`, `dropIn`, `moveTab`, `getAll`).
