# FileTransaction

`core/shell/harness-connections/FileTransaction.js`

Groups the file writes and deletions of one connect or disconnect so a failure
leaves every file as it was.

## Methods

- `FileTransaction.run(work)` calls `work(tx)`; on a throw, every touched file is
  restored in reverse order (files that did not exist are removed again) and the
  error is rethrown with `(and restoring failed: <file>: <reason>)` appended when
  a restore itself failed.
- `tx.write(file, text)` and `tx.remove(file)`; a write of identical text or the
  removal of a missing file is skipped and not journaled.

## Why

Connectors touch up to three files plus the manifest; a half-applied connection
would leave an agent pointed at a provider that is not configured. Split out of
`HarnessConnections`.
