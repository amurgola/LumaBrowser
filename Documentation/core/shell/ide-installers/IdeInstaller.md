# IdeInstaller

`core/shell/ide-installers/IdeInstaller.js`

Base class for putting the LumaBrowser plugin into a family of IDEs.
Implementations: `IdePluginInstaller` (JetBrains), `VscodeExtensionInstaller`
(VS Code family).

## Public contract

- `available()` (abstract): is the plugin bundled in this build.
- `sourceVersion()` (abstract): the bundled plugin's version.
- `detectIdes()` (abstract): one row per detected IDE, at least
  `{ id, label, installed, installedVersion, current, latest }`.
- `new IdeInstaller({ settings?, autoInstallKey? })`: a settings store
  (`get(key, fallback)`, `set(key, value)`) and the boolean key of the
  "install automatically everywhere" switch; without both the family has no switch.
- `status()` returns `{ available, sourceVersion, autoInstall, ides, ...details }`
  (`autoInstall` null without a switch).
- `autoInstall()`; `setAutoInstall(enabled)` persists the switch and, when turned
  on, installs everywhere at once: `{ autoInstall: true, installed, failed, ides }`
  (off: `{ autoInstall: false, ides }`). Throws without a switch.
- `install(ids?)` resolves `{ installed: id[], failed: [{ id, error }], ides }`;
  rejects with the not-bundled message when `available()` is false.
- `uninstall(ids?)` resolves `{ removed: id[], failed: [{ id, error }], ides }`.
- `refreshIfInstalled()` resolves the ids refreshed at boot: stale installs, or
  with the switch on every detected IDE without a current copy. Failures are
  skipped until the next boot.

An empty or missing `ids` means every detected IDE. Failures are reported per
IDE using the error message, or `INSTALL_FAILED` / `REMOVE_FAILED` when the
error has none.

## Subclass hooks

- `_statusDetails()`: extra status keys (default none).
- `_notBundledMessage()`: the install refusal text.
- `_installInto(ide)` / `_removeFrom(ide)`: act on one row; throw to fail.
- `_staleIdes()`: rows the boot refresh should reinstall.

## Why

Settings, General renders both IDE families with one list and one set of IPC
handlers, so both must expose the same shapes. Every method is async because the
VS Code family installs through a child process.
