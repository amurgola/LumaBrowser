# TaskPanel

`core/dashboard/ui/js/tasks/TaskPanel.js`

A widget's "Scheduled updates: <title>" modal.

## Methods

- `open(rootId, widgetTitle)`, `render(el, rootId)`: one row per task (escaped
  title, "<n> min", " · last run <status>", " · paused", prompt), the empty note,
  the [TaskForm](TaskForm.md), then a badge refresh.
- Row buttons: Run now (shows "Running…", then a status line: "Run finished.
  Widget data is up to date." or "Run failed: <error>"), Pause/Resume, History
  ([TaskHistory](TaskHistory.md)), Delete (two clicks within `DELETE_ARM_MS`
  3000: "Really delete?"). Changes re-render the panel.
