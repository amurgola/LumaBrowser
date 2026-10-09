# StatusPicker

`extensions/personal-hub/ui/widgets/StatusPicker.js`

The board widget's "which ClickUp status?" dialog: shown when a task is moved
(or added) into a column that has no linked status in the task's list (a
`needsStatus` reply from `moveTask` or `createTask`, see
[BoardService](../../board/BoardService.md)). It lists the list's statuses in
their own colours, notes the column each one shows in today, and resolves the
pick, or `null` when cancelled.

## Methods

- `new StatusPicker(root)`: `root` is the widget root (positioned); the dialog
  is appended inside it.
- `pick({ taskTitle, columnTitle, where, statuses })` -> `Promise<status |
  null>`: closes any open picker (resolving it with `null`) and shows a new
  one. `statuses` is the reply's `[{ status, color, columnKey, columnTitle }]`.
  The first option takes focus.
- `close(value = null)`: removes the dialog and resolves the pending promise
  with `value`.
- `isOpen()`.

## Layout

- `.hub-picker-backdrop` (a click on the backdrop itself cancels) around a
  `.hub-picker` dialog: an eyebrow with `where` (`Source / List`, else
  `ClickUp`), the title `Which status is "<column>"?`, and a help line saying
  the picked status is linked to the column so its tasks show there from now
  on.
- One `.hub-picker-option` button per status: the
  [TaskChrome](TaskChrome.md) status pill and a note: `now in <column>; its
  tasks move here` when it is linked elsewhere, `already here` when it shows in
  this column, `not linked yet` otherwise.
- Without statuses: `ClickUp did not return the statuses of this list. Try
  again after the next sync.`
- A `Cancel` button.
