# RedirectTarget

`core/shell/shellClassifier/RedirectTarget.js`

Recognizes redirect targets that are not files.

## Methods

- `RedirectTarget.isNull(target)` is true (case-insensitive, quotes ignored) for `/dev/null`, `nul`, `nul:`, `$null`,
  `/dev/stdout`, `/dev/stderr`, `&1`, `&2`.
- `RedirectTarget.NULL_TARGETS`.

## Why

A redirect to a file demotes a readonly command to normal and counts as a write for the writes-stay-within check;
`ls > /dev/null` must do neither.
