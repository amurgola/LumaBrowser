# BoardColumnsSection

`extensions/personal-hub/ui/settings/BoardColumnsSection.js`

The Hub settings tab's board columns: an editable list (title, key, done flag,
order) saved as one set, which the board widget's lanes and the task trackers'
status maps are built from.

## Behaviour

- One row per column: title, key, a Done checkbox, Up / Down (disabled at the
  ends), Remove. `Add column` appends a blank row and focuses its title.
- A key that was never typed by hand follows the title as a slug
  (`slug('In Progress')` = `in-progress`); typing in the key field pins it.
- Reorder and remove read the inputs back first, so edits survive the
  re-render.
- `Save columns` sends `saveColumns([{ id?, key, title, sortOrder, isDone }])`
  in display order; blank rows are dropped and duplicate keys skipped. At
  least one column is required. The reply's columns (or the payload) go to
  `onSaved`, which the tab routes to the task-tracker section's status map.

## Methods

- `new BoardColumnsSection(tab, { onSaved })`.
- `columns()`: the loaded columns.
- `static slug(title)`.

## IPC

`listColumns`, `saveColumns(columns)`.
