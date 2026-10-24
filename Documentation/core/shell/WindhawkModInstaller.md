# WindhawkModInstaller

`core/shell/WindhawkModInstaller.js`

Puts the bundled Windhawk mods (`integrations/windhawk/*.wh.cpp`) into the
user's Windhawk the way Windhawk's own editor installs a local mod, so they
show up and run in Windhawk like any mod the user wrote. Backs the Windhawk list
in Settings > General next to the JetBrains and VS Code installers, over the
same `status` / `install` / `uninstall` shape.

Every mod is installed under the id `local@<id>` (Windhawk's prefix for local
mods: no update checks against its online repository), which is also the
registry key name, the DLL name prefix, the `ModsSource` file name and the
compiled `WH_MOD_ID`.

## Install, per mod

1. Compile as the user with Windhawk's compiler
   ([WindhawkCompiler](windhawk/WindhawkCompiler.md)) for each `@architecture`
   target into a temp folder; the DLL is `local@<id>_<version>_<6 digits>.dll`.
2. One elevated step ([WindhawkElevation](windhawk/WindhawkElevation.md), one
   UAC prompt for the whole click) then:
   - copies the DLL into `<data>\Engine\Mods\<32|64|arm64>\`;
   - writes `HKLM\<RegistryKey>\Engine\Mods\local@<id>\Settings` (the mod's
     default settings, [WindhawkModSource](windhawk/WindhawkModSource.md)
     `initialSettings`, with values the user already set kept);
   - writes `HKLM\<RegistryKey>\Engine\Mods\local@<id>`: `LibraryFileName`,
     `Disabled` (kept on update, else 0), `Include`, `Exclude`,
     `Architecture` (`|`-joined header values), `Version`,
     `SettingsChangeTime`;
   - copies the source to `<data>\ModsSource\local@<id>.wh.cpp`;
   - deletes older `local@<id>_*.dll` files (one still loaded is left, as
     Windhawk does; the next install removes it).

Windhawk's engine notices the registry change and loads the mod into running
processes at once (verified on Windhawk 1.7.3: install, update in place and
removal, no restart).

## Methods

- `new WindhawkModInstaller({ modsDir, platform?, locator?, registry?, elevation?, compilerFor?, fsOps?, now? })`
  throws without `modsDir`; the rest are seams.
- `available()`: the build ships at least one mod.
- `status()` -> `{ available, windhawk, emptyReason, summary, sourceVersion: null, ides }`:
  `windhawk` is [WindhawkLocator](windhawk/WindhawkLocator.md) `locate()` plus
  `supported`, `tested` and `reason`; `ides` has one row per bundled mod
  `{ id, label, description, version, installed, installedVersion, current, enabled, latest: true }`
  (empty while Windhawk is missing or unsupported, with `emptyReason` saying why).
- `install(ids?)` -> `{ installed, failed: [{ id, error }], ides }`. Empty `ids`
  means every bundled mod except `TEMPLATE_IDS` (`luma-desktop-ping`, which only
  logs). A compile failure fails that mod; a declined UAC prompt fails all of
  the click's mods with "The administrator prompt was declined".
- `uninstall(ids?)` -> `{ removed, failed, ides }`: deletes the mod's
  `Engine\Mods` and `Engine\ModsWritable` keys, waits `UNLOAD_WAIT_MS` for the
  engine to unload it, then removes the source, the mod storage folder and the
  DLLs of every architecture, retrying a still-loaded DLL for up to
  `UNLOAD_RETRY_MS` (8 s; a 32-bit host held one past the first wait in the
  live test).
- `refreshIfInstalled()` always resolves `[]`: an update needs a UAC prompt,
  so the settings row shows Update instead of refreshing at boot.

## Supported installs

- Windows only; Windhawk found through `windhawk.ini` (`WINDHAWK_ROOT`, then
  `%ProgramFiles%\Windhawk`).
- Windhawk 1.x (`SUPPORTED_MAJOR`); 1.7.x is the tested range
  (`TESTED_VERSIONS`), others get "(not yet tested with this installer)" in the
  summary.
- Portable Windhawk (configs in ini files) is refused, as is an install
  without its compiler.
