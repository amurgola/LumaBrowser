# ConnectionStager

`core/shell/harness-connections/ConnectionStager.js`

Works out, without writing anything, what a connect or disconnect would do to
one harness's files. [HarnessConnections](HarnessConnections.md) commits the
result; `preview` just reports it.

## Methods

- `new ConnectionStager({ paths, manifest, backups, getEndpoints, getModel, now })`.
- `stageConnect(connector)` -> `{ workingSet, ledger, endpoints, model, previousFiles }`:
  the connector's plan applied by [ChangeApplier](changes/ChangeApplier.md), chained
  to any stored ledger.
- `stageDisconnect(connector)` -> `{ workingSet, kept, restored }`:
  1. files untouched since our write are replaced by their backup ([ConfigBackups](ConfigBackups.md));
  2. the rest are undone key by key by [ChangeReverter](changes/ChangeReverter.md);
  3. a file LumaBrowser created that is now blank (no keys, no comments) is deleted.
- `drift(connector, entry)` -> `[{ file, path, removed }]` keys the user changed.

## Why

Staging is pure, so connect, disconnect and preview share one code path and a
preview is exactly what a commit would write. With no ledger stored (older
version, or a lost manifest) the ledger is inferred from the connector's plan
plus its `legacyPriors`; without any record, a model selection cannot be known
and is left alone.
