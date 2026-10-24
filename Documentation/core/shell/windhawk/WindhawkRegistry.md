# WindhawkRegistry

`core/shell/windhawk/WindhawkRegistry.js`

Reads the mod configs Windhawk's engine keeps under
`HKLM\<RegistryKey>\Engine\Mods` with `reg.exe query /s /reg:64` (readable
without elevation).

## Methods

- `new WindhawkRegistry({ run? })`: `run(args)` resolves `{ code, stdout }`.
- `readMods(registryKey)` -> `{ '<modId>': { values, settings } }`; `values`
  are the mod key's values (`LibraryFileName`, `Disabled`, `Version`, ...),
  `settings` its `Settings` subkey. A missing key gives `{}`.
- `WindhawkRegistry.parse(stdout, root)`: the parser; `REG_DWORD` and
  `REG_QWORD` become numbers, everything else stays a string.
