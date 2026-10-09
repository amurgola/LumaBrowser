# DashboardTasks

`core/dashboard/ui/js/tasks/DashboardTasks.js`

Scheduled tasks on the Dashboard: the schedule panel, card badges and the task
event stream. Every method is a no-op when the preload has no `tasks`.

## Methods

- `new DashboardTasks(api, doc, { onRunFinished })`.
- `openPanel(rootId, title)` ([TaskPanel](TaskPanel.md)), `refreshBadges()`
  ([TaskBadges](TaskBadges.md)); both return promises.
- `wireEvents()`: `run-finished` calls `onRunFinished` (the page remounts stale
  widgets: a run may have edited the module); `run-started` and `run-finished`
  refresh badges.
