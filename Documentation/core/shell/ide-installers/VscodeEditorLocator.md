# VscodeEditorLocator

`core/shell/ide-installers/VscodeEditorLocator.js`

Finds VS Code family editors by their CLI launcher and reads which version of an
extension each has installed.

## Methods

- `new VscodeEditorLocator({ platform, homeDir, env, fsOps })`
- `findCli(editor)` returns the first existing known install location for the
  platform, else the launcher found on `env.PATH` (or `env.Path`), else `null`.
  On Windows it probes `<cli>.cmd` then `<cli>.exe` on a `;` PATH; elsewhere
  `<cli>` on a `:` PATH.
- `extensionsDir(editor)` is `<homeDir>/<editor.dataDir>/extensions`.
- `installedVersion(editor, extensionId)` scans that folder for
  `<extensionId>-*` (case-insensitive), takes each folder's `package.json`
  version (else the folder-name suffix), and returns the newest, or `null`.
- `VscodeEditorLocator.EDITORS`: the family table. Each entry has `id`,
  `label`, `cli`, `dataDir`, and `win`, `mac`, `linux` install locations, where
  `%L` is `%LOCALAPPDATA%\Programs` and `%P` is `%ProgramFiles%`.

## Why

`package.json` wins over the folder name because the name can lag behind a
reinstall. Several leftover folders can exist; the newest is the installed one.
The table must match the locations `build/installer.nsh` probes.
