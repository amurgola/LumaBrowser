# ActivityLogService

`core/activity-log/ActivityLogService.js`

The universal activity logger available to every extension and core service:
one-shot entries and timed spans, grouped by correlation id so one high level
operation (e.g. "generate template") shows as one row with a tree of children.

## Methods

- `new ActivityLogService(store, settingsDb)`; `store` is the ActivityLogStore,
  `settingsDb` the settings db (`get`, `set`). Schedules pruning: first run after
  30 s, then every 6 h (both timers unref'd).
- `log(entry)` writes a zero-duration row. `entry`: `{ caller, action, result?='info',
  summary?, tabId?, url?, correlation?, parentId?, details?, ts? }`. Returns the row
  id, or null when disabled, invalid, or the insert failed.
- `startSpan(entry)` writes an `in_progress` row and returns a handle
  `{ id, correlation, tsStart, caller }` (null when disabled or failed). A missing
  correlation gets a random 16-hex id.
- `finishSpan(handle, { result?='success', summary?, details? })` stamps end time
  and duration. A null handle is ignored.
- `span(entry, fn)` runs `fn(spanCtx)` as a span (see ActivityLogSpanContext).
  A throw finishes the span as `failure` with `{ error, stack, ...ctx details }`
  and is rethrown. When disabled, `fn` gets `ActivityLogSpanContext.NOOP`.
- `forCaller(caller, meta)` registers the caller and returns an ActivityLogCallerLogger.
- `registerCaller(caller, meta)` / `unregisterCaller(caller)` advertise a caller
  to the settings UI before it logs.
- `getKnownCallers()` rows `{ caller, label, description, source, enabled }`,
  sorted by caller; source is `registered`, `observed` or `persisted`.
- `isEnabled(caller)`.
- `getSettings()` / `setSettings(patch)` (see ActivityLogSettings).
- `getEntries(filter)`, `getEntry(id)` (with `children`), `getByCorrelation(c)`,
  `count()`, `clear()`: pass-throughs to the store.
- `prune()` applies the retention limits now. Store errors are logged, not thrown.
- `destroy()` stops both prune timers and closes the store.

## Why

Disabled by default, every call short-circuits on the per-caller check before
touching the db, so leaving log calls in hot paths is free. Store failures are
caught and logged because a broken log must never break the work being logged.
