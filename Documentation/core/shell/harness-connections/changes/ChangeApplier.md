# ChangeApplier

`core/shell/harness-connections/changes/ChangeApplier.js`

Applies a [ConnectionPlan](ConnectionPlan.md) to a [WorkingSet](WorkingSet.md)
and returns the ledger ([LedgerEntry](LedgerEntry.md)).

## Methods

- `ChangeApplier.apply({ plan, workingSet, connector, previous? })` where
  `previous` is `{ ledger, endpoints }` from an earlier connect.
  - Each setting is written and recorded with the key's prior value.
  - A seed that finds the key set is skipped (kept in the ledger only if it is
    still our earlier value).
  - On a reconnect, a key that still holds our earlier value (as judged by
    `connector.owns`) keeps its original prior, so disconnect returns to the
    pre-LumaBrowser state, not to our previous connection.
  - Earlier entries the new plan no longer mentions (for example a model selected
    last time) stay in the ledger.
