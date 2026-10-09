# ExecutableFinder

`core/shell/harness-connections/ExecutableFinder.js`

Resolves a program name to its executable on PATH without spawning a shell.

## Methods

- `ExecutableFinder.find(name, executableDirs = process.env.PATH, env = process.env, platform = process.platform)`
  returns the first matching file or `null`. On Windows it tries the bare name
  then each `PATHEXT` suffix (default `.COM;.EXE;.BAT;.CMD`) and only checks
  existence; elsewhere the file must have the execute bit. Directories never
  match. `executableDirs` is split on `path.delimiter`.

## Why

Harness detection must tell whether a tool is really installed. npm's own shims
in `node_modules/.bin` are skipped because they are not an installation. On a
case-insensitive file system the returned suffix takes the case from `PATHEXT`.

Reuse candidate for `core/shared`: `VscodeEditorLocator` does a similar PATH
probe for editor CLIs (with platform-specific separators for cross-platform
tests); a shared PATH lookup could serve both.
