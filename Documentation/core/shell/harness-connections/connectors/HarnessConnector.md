# HarnessConnector

`core/shell/harness-connections/connectors/HarnessConnector.js`

Base class for the "connect your agent" connectors:
[ClaudeCodeConnector](ClaudeCodeConnector.md), [CodexConnector](CodexConnector.md),
[OpenCodeConnector](OpenCodeConnector.md), [ClineConnector](ClineConnector.md).
A connector only describes a harness; reading, writing, preview and undo are done
by the change engine ([ChangeApplier](../changes/ChangeApplier.md),
[ChangeReverter](../changes/ChangeReverter.md)).

## Public contract

- `id`, `name`, `executable` (looked up on PATH), `format` (the
  [ConfigDocument](../documents/ConfigDocument.md) class of the first config file).
- `configFiles(paths)` (abstract): every file the connector may change; the first
  is the one `inspect` reads.
- `plan({ paths, endpoints, model, now })` (abstract): the
  [ConnectionPlan](../changes/ConnectionPlan.md). `model` may be null; then nothing is selected.
- `inspect({ paths, endpoints })` -> `{ state: 'connected' }`, `{ state: 'disconnected', reason }`
  or `{ state: 'unavailable', reason: 'Fix invalid JSON|TOML in <file> before connecting or disconnecting.' }`.
- `owns(entry, found, data, endpoints)` whether the value at a ledger key is still ours.
- `legacyPriors(restore, paths)` -> `[{ file, path, prior }]` from a pre-ledger
  manifest `restore` record (default none).

## Subclass hooks

- `_isConnected(data, endpoints)` (abstract).
- `_recognises(entry, value, data, endpoints)`: by default only the exact value we
  wrote; connectors widen it for values a user picks from our lists.
- Helpers `_isAt(entry, path)`, `_prior(file, path, value)`, `_mcpEnv(endpoints)`;
  constants `LOCAL_TOKEN` (`lumabrowser-local`, placeholder key: the Local API has
  no auth) and `MCP_NAME` (`luma-browser`).
