# CliShim

`core/shell/CliShim.js`

Puts the `luma` terminal command on the user's PATH: copies the bundled CLI,
writes a launcher that runs it under the app binary, and keeps both current.
Thin facade over `cli-shim/LauncherScript`, `cli-shim/PathEntries` and
`cli-shim/WindowsUserPath`.

## Methods

- `new CliShim({ exePath, cliSource, version?, platform?, homeDir?, localAppData?, fsOps?, exec?, envPath? })`
  `exePath` is the app binary (the `.AppImage` file on Linux AppImage),
  `cliSource` the folder holding the CLI package. Throws without either.
  `exec` is an `execFile`-shaped function; `envPath` the PATH to consult
  (default `process.env.PATH`).
- `shimDir()`, `shimPath()`, `cliDir()`, `cliScript()`: the layout below.
- `renderShim()`: the launcher text for this platform.
- `status()` resolves `{ installed, current, onPath, shimPath, cliDir, cliVersion, note }`.
  `current` means the launcher points at this binary and CLI copy; `note` is the
  one thing the user should know (not on PATH, older launcher, open a new terminal).
- `install()` copies the CLI, writes the launcher (mode 0755), and on Windows
  adds the launcher folder to the user PATH. Resolves `status()` plus
  `pathChanged`. A failed PATH edit rejects.
- `uninstall()` removes the launcher, the CLI copy and (Windows) the PATH entry.
  Resolves `status()` plus `pathChanged`; a failed PATH edit gives `false`.
- `refreshIfInstalled()` (boot) rewrites both when a launcher exists but names
  another binary or an older CLI copy. Never installs, never touches PATH, never
  throws; resolves whether anything was rewritten.
- `isWindows` (getter).
- Statics: `APP_DIR_NAME`, `SHIM_NAME_WIN`, `SHIM_NAME_POSIX`, `CLI_FILES`,
  `VERSION_FILE`, `LAUNCHER_MODE`.

## Layout

| | Launcher | CLI copy |
|---|---|---|
| Windows | `%LOCALAPPDATA%\LumaBrowser\bin\luma.cmd` (folder added to user PATH) | `%LOCALAPPDATA%\LumaBrowser\cli\` |
| POSIX | `~/.local/bin/luma` | `~/.local/share/LumaBrowser/cli/` |

Only `bin`, `lib`, `package.json`, `README.md` and `LICENSE` are copied, plus a
`.app-version` stamp used by the refresh check.

## Why

The CLI ships inside the app (`resources/cli`, plain JS, zero dependencies) and
runs under the app's own binary in Node mode, so no Node install is needed; only
a launcher on PATH. This class owns that launcher for the runtime toggle
(Settings, General, Terminal) and for portable, AppImage and DMG installs where
no installer ran. The NSIS installer (`build/installer.nsh`) writes the same
files the same way, so the two never disagree.

The CLI is copied rather than referenced because an AppImage's resources only
exist while it is mounted and a portable exe can move. On Windows, PATH edits go
through the registry so new terminals see them; the current terminal will not,
which is what the status note says.
