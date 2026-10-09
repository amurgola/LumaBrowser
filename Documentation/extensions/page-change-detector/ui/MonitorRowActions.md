# MonitorRowActions

`extensions/page-change-detector/ui/MonitorRowActions.js`

What a monitor row's buttons do.

## Methods

- `new MonitorRowActions(invoke, reload, hooks)`: `hooks` is
  `{ onEdit(m), onFullHistory(id), onDeleted(id) }`.
- `check(id, btn)`: `checkNow`; the button shows `Checking` while busy; a
  failed check shows on the row, never modal; always reloads.
- `openMenu(anchor, m)`: OverflowMenu with Pick elements to watch (or Refine
  picked elements plus Watch the whole page), Pause/Resume, Edit, Full
  history, a separator, Delete (danger).
- `toggle(m)`; `remove(m)` (Dialogs.confirm
  `Delete monitor "<name>" and all of its history?`, Delete, danger);
  `pick(m)` (alerts when the picker cannot start or nothing was picked);
  `clearSelectors(m)` (confirms first).

## Globals

Reads `window.LumaModal` through Dialogs.
