# WindhawkLocator

`core/shell/windhawk/WindhawkLocator.js`

Finds a Windhawk install from its `windhawk.ini` (`[Storage]`:
`Portable`, `CompilerPath`, `EnginePath`, `AppDataPath`, `RegistryKey`).

## Methods

- `new WindhawkLocator({ env?, fsOps?, platform? })`.
- `locate()` -> `{ found: false, reason }` or `{ found: true, root, version,
  portable, compilerDir, engineDir, dataDir, registryKey, modsSourceDir,
  engineModsDir, engineModsWritableDir }`. Roots tried: `WINDHAWK_ROOT`,
  `%ProgramFiles%\Windhawk`, `%ProgramW6432%\Windhawk`,
  `C:\Program Files\Windhawk` (a root needs `windhawk.ini` and
  `windhawk.exe`). `version` is the engine folder name (`Engine\1.7.3`);
  `%VAR%` in paths is expanded; `registryKey` drops the `HKLM\` hive.
- `WindhawkLocator.readIni(fsOps, file)`: UTF-16 LE (with BOM) or UTF-8 ini
  -> `{ Section: { key: value } }`.
