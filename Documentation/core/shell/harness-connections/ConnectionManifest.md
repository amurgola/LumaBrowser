# ConnectionManifest

`core/shell/harness-connections/ConnectionManifest.js`

LumaBrowser's own record of its agent connections, `harness-connections.json`
under the app base dir: `{ version: 2, connections: [entry] }`.

An entry is `{ harness, ledger, files, endpoints, model, updatedAt }`: the
[LedgerEntry](changes/LedgerEntry.md) list, the [ConfigBackups](ConfigBackups.md)
file records, and what was written. Entries from before the ledger carry a
`restore` record instead.

## Methods

- `new ConnectionManifest(file)`; `file()`.
- `entry(harness)` the stored entry or null.
- `save(entry, tx?)` replaces the entry for `entry.harness`; `drop(harness, tx?)`.
  With a [FileTransaction](FileTransaction.md) the write rolls back with the config files.

## Why

A missing, unparseable or oddly shaped manifest reads as empty: the state shown
to the user always comes from the config files themselves, so a lost manifest
only loses exact undo, never correctness of the status.
