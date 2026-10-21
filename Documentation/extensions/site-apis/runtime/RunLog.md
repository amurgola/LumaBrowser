# RunLog

`extensions/site-apis/runtime/RunLog.js`

The per-step log of one run and the list of healed steps; the RunResult and the run row both carry them.

## Methods

- `new RunLog({ now? })`.
- `begin(index, kind)` -> `{ end(ok, { via, note, recoveryMs }) }`: opens an entry `{ index, kind, ok, ms, via,
  attempt }` and closes it with the elapsed time; `note` is added when given, `recoveryMs` when a selector
  recovery ran (the part of `ms` spent in it, possibly 0; absent when the stored selector worked).
- `heal(step, selector)`: lists a healed step once, with the latest selector.
- `nextAttempt()`: later entries carry the next attempt number.
- `toJSON()` -> the entries; `entries` and `healed` are readable directly.

`VIA_*` constants name the `via` values: `primary`, `recovered`, `direct` (targeted steps), `page` (page actions),
`local` (transform), `llm` (llm_transform).
