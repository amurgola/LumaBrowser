# SystemLibraries

`core/llm-server/ui/js/setup/SystemLibraries.js`

The Linux system-library preflight, run before any download.

## Methods

- `SystemLibraries.problem(system)` calls `system.checkSystemLibraries()` and
  resolves the failing result (`{ ok: false, message, aptLine, missing,
  packages }`, accepting the reply bare or under `.result`), or `null` when the
  host is fine, the check is unavailable, or the check itself throws.

## Globals

None.
