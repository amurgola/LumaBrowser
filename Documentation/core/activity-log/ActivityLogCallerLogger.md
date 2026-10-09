# ActivityLogCallerLogger

`core/activity-log/ActivityLogCallerLogger.js`

A logger bound to one caller name; what extensions receive as `context.logger`
(from `ActivityLogService.forCaller`).

## Methods

- `log(entry)`, `span(entry, fn)`, `startSpan(entry)` call the service with
  `caller` filled in unless the entry names one.
- `finishSpan(handle, patch)` pass-through.
- `isEnabled()` whether this caller is currently logging.
- `info / warn / error / debug(message, details?)` write
  `{ action: 'message', result: <level>, summary: String(message), details }`.
- `caller` the bound name.

Every method is bound, because callers keep detached references
(PermissionManager stores `logger.log` on itself).

## Why the console-style methods

Add-ons written against a plain console-like logger (ik_llama, NInfer) call
`context.logger.info(...)`; without these their activation threw and the
add-on never loaded.
