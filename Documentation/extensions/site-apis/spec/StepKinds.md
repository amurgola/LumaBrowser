# StepKinds

`extensions/site-apis/spec/StepKinds.js`

The step catalog of an endpoint script: `CATALOG` (kind to required and optional fields), `TARGETED` (kinds that
need a `selector` or a `description`), `OPTIONAL_TARGET`, `PRODUCERS` (kinds that set the current result),
`TRANSFORM_OPS`, `FILTER_OPS`, `WAIT_STATES`, `SCROLL_DIRECTIONS`. See `Design.md` for the step table.

## Methods

- `validate(step, index)`: throws a message naming the 1-based step on the first problem (unknown kind, missing
  field, no target, bad transform op) and answers the normalized step (known fields only, trimmed strings, empty
  selector or description dropped).
- `isTargeted(kind)`, `mayTarget(kind)`.
