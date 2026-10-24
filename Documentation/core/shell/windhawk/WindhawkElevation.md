# WindhawkElevation

`core/shell/windhawk/WindhawkElevation.js`

The one elevated step of a Windhawk install or removal. Windhawk's data folder
(`%ProgramData%\Windhawk`) and its `HKLM` key are writable by administrators
only, so every op of one click goes into a JSON plan that a short PowerShell
script carries out after a single UAC prompt.

The plan and the script are temp files whose paths reach the elevated
PowerShell through environment variables (`LUMA_WH_SCRIPT`, `LUMA_WH_PLAN`);
nothing from the plan is pasted into a command line. The launcher runs
`Start-Process powershell.exe -Verb RunAs -Wait`; a declined prompt exits 1223.

## Ops (run in order, HKLM on the 64-bit registry view)

`mkdir { path }`, `copy { from, to }`, `regSetValues { key, values: [{ name,
kind: 'string' | 'dword', data }], replace }` (replace clears the key's values
first), `regDeleteKey { key }` (a missing key is fine), `deleteFile { path }`,
`deleteDir { path }`, `deleteOldDlls { dir, prefix, keep, retryMs }` (Windhawk's own
`<prefix><...>_<digits>.dll` match; a DLL a process still has loaded is
retried every 250 ms until `retryMs`, then left), `sleep { ms }`. The first failing op stops
the plan unless it is `optional`.

## Methods

- `new WindhawkElevation({ run?, tmpDir? })`: `run(cmd, args, { env, timeout })`
  resolves `{ code, output }`.
- `apply(ops)` -> `{ ok, canceled, errors: [{ op, error }] }`; never throws.
  The temp folder is removed afterwards.
- Statics: `SCRIPT` (the elevated script), `LAUNCHER`, `CANCELED` (1223),
  `TIMEOUT_MS`.
