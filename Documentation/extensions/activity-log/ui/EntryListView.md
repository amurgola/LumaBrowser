# EntryListView

`extensions/activity-log/ui/EntryListView.js`

The Activity Log viewer's entry list.

## Methods

- `new EntryListView(listEl, onSelect)`: `onSelect(id)` runs on a row click.
- `render(entries, selectedId, loggingOn)`: one `.al-entry-row` per entry
  (local time, short caller with the full id as title, summary or action,
  duration, result badge `al-result-<result>` defaulting to `info`). No
  entries: `No entries yet.`, plus the "Logging is off" hint when `loggingOn`
  is false.
- `renderError(message)`: `Error: <message>` (escaped; `unknown` when empty).
- `markSelected(id)`: toggles `al-entry-row--selected` by `data-id`.
