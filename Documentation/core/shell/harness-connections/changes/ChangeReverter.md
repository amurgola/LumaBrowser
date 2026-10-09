# ChangeReverter

`core/shell/harness-connections/changes/ChangeReverter.js`

Undoes a ledger ([LedgerEntry](LedgerEntry.md)) on a [WorkingSet](WorkingSet.md).

## Methods

- `assess({ ledger, workingSet, connector, endpoints })` -> `[{ entry, found, ours }]`,
  judged on the files as they are, before any undo (`connector.owns`).
- `drift(args)` -> `[{ file, path, removed }]` keys the user changed or removed.
- `revert(args)` undoes our keys in reverse order and returns the user-edited keys
  left in place (`[{ file, path }]`). A key goes back to its prior value, or is removed
  together with the containers our write created once they are empty.
- `inferLedger(plan, priors?)` a ledger rebuilt from a plan when none was stored;
  `priors` (`[{ file, path, prior }]`) come from a connector's `legacyPriors`. Inferred
  entries prune any emptied parent; inferred seeds are only undone when a connector
  rule claims them.

## Why

A value the user changed after connecting is theirs: it is kept and reported
rather than silently overwritten, and the Settings panel can show it as drift.
