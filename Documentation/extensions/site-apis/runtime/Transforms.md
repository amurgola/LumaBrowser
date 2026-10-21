# Transforms

`extensions/site-apis/runtime/Transforms.js`

The deterministic ops of a `transform` step over the current result. Pure functions; a misuse throws a plain
Error the executor turns into `step_failed`.

## Ops (`Transforms.apply(step, result)`)

- `sort { by, order: 'asc' | 'desc', numeric? }`: rows only; natural, case-insensitive text order or numeric;
  missing and unparsable values always sort last.
- `filter { field, filterOp, value }`: rows only; `filterOp` from `StepKinds.FILTER_OPS` (`eq` default; `eq` /
  `neq` compare trimmed lower-case text, `contains` / `not_contains` case-insensitive, `gt` / `gte` / `lt` / `lte`
  numeric, `matches` a case-insensitive regex, `present` non-empty).
- `limit { count }`, `first` (the first row or null).
- `pick { fields }`, `rename { map }`, `parse_number { fields }`: rows or one object. `parse_number` keeps digits,
  `.`, `-`, `e` and `+`, so `$1,200.50` becomes `1200.5`; an unparsable value becomes null.
- `flatten { path }`: an object answers the value at the dot path; rows concatenate each row's value at the path
  (lists spread, scalars appended, missing skipped).

## Helpers

`get(value, dotPath)`, `toNumber(value)`, `isObject(value)`, `describe(value)` (used in fault messages).
