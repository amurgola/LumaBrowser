# HarnessConnections

`core/shell/harness-connections/HarnessConnections.js`

One-click "connect your agent" for Claude Code, Codex, OpenCode and Cline
([HarnessConnector](connectors/HarnessConnector.md) and its four implementations).
The service the Settings panel talks to (through
[AgentHarnessSettings](../settings/AgentHarnessSettings.md)).

## Methods

- `new HarnessConnections({ getEndpoints, getModel?, paths?, executableDirs?, now? })`;
  throws without `getEndpoints`. `getEndpoints()` ->
  `{ openaiBaseUrl, anthropicBaseUrl, mcp: { command, args, env } }`; `getModel()` ->
  the loaded chat model id or null; `now()` -> a Date (tests).
- `HarnessConnections.paths({ home, env, baseDir })`: `manifest` and `backups`
  (under the app base dir), `claudeSettings` (`CLAUDE_CONFIG_DIR`), `claudeUser`,
  `codexConfig` (`CODEX_HOME`), `opencode` (`OPENCODE_CONFIG`, else the last existing
  of config.json / opencode.json / opencode.jsonc under `XDG_CONFIG_HOME/opencode`),
  `clineProviderSettings` (`CLINE_PROVIDER_SETTINGS_PATH`, `CLINE_DATA_DIR`), `clineModels`,
  `clineMcp`, and two `skills` files.
- `connectors()` the four connectors in list order.
- `list()` `[{ id, name, executable, installed, configFiles, state, reason, connectedAt, model, needsRepair, drift }]`.
  State always comes from re-reading the files; `drift` is `[{ file, path, removed }]`
  for keys the user changed since connect.
- `preview(id, action = 'connect')` what `connect` or `disconnect` would do, with nothing
  written: `{ harness, action, files: [{ file, before, after }], kept }` (`after` null = delete).
- `connect(id)` `{ success, harness, files, model, changed }`.
- `disconnect(id)` `{ success, harness, kept, restored }`: `kept` are user-edited keys left
  in place, `restored` the files put back byte for byte from their backup.
- `writeSkills()` / `skillStatus()` the `luma` SKILL.md in both agent skill folders.

## Design

Connectors only *describe* what they need ([ConnectionPlan](changes/ConnectionPlan.md)).
[ConnectionStager](ConnectionStager.md) runs the change engine on an in-memory
[WorkingSet](changes/WorkingSet.md); this class then commits it:

1. under a [ConnectionLock](ConnectionLock.md), so two windows never interleave;
2. connect backs up each existing file on its first change ([ConfigBackups](ConfigBackups.md));
3. all file writes plus the manifest write go through one [FileTransaction](FileTransaction.md),
   so any failure rolls every file back;
4. the [ConnectionManifest](ConnectionManifest.md) stores the ledger
   ([LedgerEntry](changes/LedgerEntry.md)): each key written, the value written, and its prior value.

Why a ledger instead of per-connector restore code: one engine
([ChangeApplier](changes/ChangeApplier.md) / [ChangeReverter](changes/ChangeReverter.md))
undoes every connector the same way, restores exactly the prior value of every key
(including "it was absent"), and can tell which keys the user changed since. Why
backups: when nothing touched a file since our write, disconnect returns it byte for
byte, whatever its formatting. Manifests from versions before the ledger (with a
`restore` record) are undone through each connector's `legacyPriors`.

## Replaces

The earlier `connect`/`disconnect` that delegated restore logic to each connector, and
the inline lock and journal (now `ConnectionLock` and `FileTransaction`). `HarnessConnections.LOCK_*`
constants moved to `ConnectionLock`.
