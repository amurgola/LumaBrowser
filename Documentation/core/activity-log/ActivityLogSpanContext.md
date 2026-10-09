# ActivityLogSpanContext

`core/activity-log/ActivityLogSpanContext.js`

The context object `ActivityLogService.span(entry, fn)` passes to `fn`.

## Methods

- `log(child)` / `span(child, fn)` log through the service with the span's
  caller, correlation and id (as `parentId`) filled in unless the child sets them.
- `update({ result?, summary?, details? })` sets what the span finishes with;
  undefined fields are left alone.
- `correlation`, `parentId` the span's correlation id and row id.
- `finalPatch()` the values set through `update`, read by the service.
- `ActivityLogSpanContext.NOOP` the frozen stand-in used when logging is off:
  `log` returns null, `span` just runs `fn(NOOP)`, `update` does nothing,
  `correlation` and `parentId` are null.

`log`, `span` and `update` are bound, so they can be destructured.
