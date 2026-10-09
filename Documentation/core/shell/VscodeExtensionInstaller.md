# VscodeExtensionInstaller

`core/shell/VscodeExtensionInstaller.js`

Puts the bundled LumaBrowser extension (`.vsix`) into VS Code and the editors
built on it (Insiders, VSCodium, Cursor, Windsurf) through each editor's own
CLI. Extends [IdeInstaller](ide-installers/IdeInstaller.md); uses
[VscodeEditorLocator](ide-installers/VscodeEditorLocator.md) and
[EditorCliRunner](ide-installers/EditorCliRunner.md).

## Methods

- `new VscodeExtensionInstaller({ vsixPath, version?, platform?, homeDir?, env?, fsOps?, run? })`
  throws without `vsixPath`. `env` supplies `LOCALAPPDATA`, `ProgramFiles`,
  `PATH`. `run(cliPath, args)` resolves `{ code, output }` (default
  `EditorCliRunner.run`).
- `available()`: the `.vsix` file exists.
- `sourceVersion()`: `version` from the `vscode.json` sidecar beside the
  `.vsix`, else the app version.
- `detectIdes()`: one row per editor whose CLI was found, in family order:
  `{ id, product, label, cliPath, extensionsDir, installed, installedVersion, current, latest: true }`.
- `status()` adds `vsixPath` and `extensionId`.
- `install(ids?)` runs `<cli> --install-extension <vsix> --force`; a non-zero
  exit fails that editor with the CLI's last meaningful output line, or
  `the <label> CLI exited with <code>`.
- `uninstall(ids?)` runs `<cli> --uninstall-extension <id>`; "not installed" in
  the output counts as success.
- `refreshIfInstalled()` reinstalls only where the installed version is older
  than the bundled one (never a fresh install, never a downgrade of a dev build).
- Statics: `EXTENSION_ID` (`lumabyte.luma-vscode`), `VSIX_NAME`
  (`luma-vscode.vsix`), `SIDECAR_FILE`, `EDITORS`.

## Why

Unlike JetBrains, VS Code does not load a dropped-in folder: since 1.72 its
extensions folder is indexed by `extensions.json` and unlisted folders are
ignored or swept. The editor's own CLI is the only supported way in, and every
fork inherits it under its own name. So "detected" means "we found this
editor's CLI", and the install state is read back from
`<home>/<dataDir>/extensions/<publisher>.<name>-<version>`. `build/installer.nsh`
runs the same command from the same locations on Windows.
