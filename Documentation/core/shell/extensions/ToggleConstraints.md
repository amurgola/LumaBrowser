# ToggleConstraints

`core/shell/extensions/ToggleConstraints.js`

Whether each discovered extension can be switched on or off now.

## Methods

- `ToggleConstraints.compute(ledger)` -> `{ [id]: { enabled, canToggle, reason, deletable } }`.
  An active extension another active one requires: `Required by <name>`. An
  inactive one with an inactive required extension: `Requires <name> to be
  enabled first`. `deletable` is true only for user-installed extensions.
