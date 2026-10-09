# CodeSurface

`core/shell/extensions/CodeSurface.js`

`context.code`: the coding agent's privileged workspace seam (Vibe builder, Code
and Game modes). Extensions never touch `fs` or the manager directly.

## Methods

- `new CodeSurface({ userExtensionsDir, coreServices, manifests, install(dir), capabilities(excludeId) })`; `key` is `code`.
- `forExtension(id)` -> every [CodeWorkspace](../CodeWorkspace.md) call
  (`openProject`, `writeFile`, `writeBytes`, `readFile`, `readLines`,
  `listFiles`, `editFile`, `grep`, `find`, `listDir`, `projectMap`,
  `runCommand`, `commandShell`, `contextFiles`, `validate`, `manifestSanity`,
  `discardWorkspace`) plus:
  - `createWorkspace(opts)` throws `"<id>" is a built-in extension id and cannot be used`
    for a bundled id;
  - `capabilities()` the manager's snapshot without the caller;
  - `installAndActivate(workspaceId)` -> `{ ok, extensionId?, name?, error?, errors? }`,
    never throws; `manifest check failed` with `errors` when ManifestSanity fails.
- With no user extensions dir every workspace call throws
  `code workspace unavailable - no writable extensions directory`.

## Why

One CodeWorkspace per manager, created on first use, so sub-agents share one
read ledger and edit queue. Its read-before-edit guard follows the setting
`core.shell.code.enforceObservation` (default on), a kill switch for models
that stall on re-reads.
