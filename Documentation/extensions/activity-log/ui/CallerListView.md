# CallerListView

`extensions/activity-log/ui/CallerListView.js`

The Activity Log per-caller toggle list and the viewer's caller filter.

## Methods

- `new CallerListView({ list, count, filter }, onToggle)`: `onToggle(caller,
  enabled, input)` runs when a caller switch changes.
- `render(callers, settings)`: writes `N caller(s)` and one `.al-caller-row`
  per caller (label, id, source, optional description, all escaped) with a
  switch that is on unless `settings.enabledCallers[caller] === false`. With
  the master switch off the rows get `al-caller-row--disabled` and the
  switches are disabled. No callers: the "No callers registered yet" empty state.
- `renderFilter(callers)`: rebuilds the filter options (`All callers` first),
  keeping the current selection.
