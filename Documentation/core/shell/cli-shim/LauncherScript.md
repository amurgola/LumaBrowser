# LauncherScript

`core/shell/cli-shim/LauncherScript.js`

Renders the `luma` launcher script for each platform.

## Methods

- `LauncherScript.renderWindows(exePath, cliScript)` returns the `luma.cmd`
  text (CRLF): `setlocal`, sets `ELECTRON_RUN_AS_NODE=1`, runs the binary on the
  CLI script with `%*`, exits with `%ERRORLEVEL%`.
- `LauncherScript.renderPosix(exePath, cliScript)` returns a `#!/bin/sh`
  script that `exec`s the binary in Node mode with `"$@"`.

## Why

`setlocal` keeps `ELECTRON_RUN_AS_NODE` out of the caller's cmd session. The
Windows text is kept line for line identical to `build/installer.nsh`'s writer;
`CliShim.status()` compares launchers byte for byte to decide `current`.
