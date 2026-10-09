# LedgerEntry

`core/shell/harness-connections/changes/LedgerEntry.js`

One line of the connection ledger stored in the manifest:
`{ file, format, path, wrote, prior: { present, value? }, created }`.

- `wrote` the value LumaBrowser wrote (undefined for an inferred seed).
- `prior` what the key held before, or `{ present: false }`.
- `created` the first container the write created (pruned again on undo), or null.

## Methods

- `record(setting, found, data)` a fresh entry; `renewed(entry, value)` a reconnect
  that keeps the original prior; `inferred(setting, prior?)` rebuilt from a plan.
- `prior(found)`, `sameTarget(a, b)` (same file and path), `describe(entry)` ->
  `{ file, path: 'dotted.label' }`. `ABSENT` the absent prior.

## Why

Recording the prior value per key, including absence, is what lets disconnect
restore exactly the state before LumaBrowser, independent of each connector.
