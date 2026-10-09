# ActivityText

`extensions/activity-log/ui/ActivityText.js`

Short wording for activity log rows and details. Static methods only.

## Methods

- `ActivityText.duration(ms)`: `850ms`; `4.25s` under 10 s; `12.5s` under a
  minute; else `2m 5s`.
- `ActivityText.shortCaller(caller)`: strips `ext.`, turns `core.` into
  `core: `; `''` for none.
- `ActivityText.details(details)`: indented JSON, `(none)` for null, `String()`
  when it cannot be serialised.
- `ActivityText.resultClass(result)`: `al-result-<result>`, `al-result-info`
  when empty.
