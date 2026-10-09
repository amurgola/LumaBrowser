# HostPathVariables

`core/shell/shellClassifier/hostPaths/HostPathVariables.js`

Rewrites the environment variables that name well-known host locations into canonical paths.

## Methods

- `HostPathVariables.expand(text)`: replaces `$NAME`, `${NAME}`, `$env:NAME`, `${env:NAME}` and `%NAME%` for the
  names in `LOCATIONS` (home, profile, SystemRoot/windir, SystemDrive/HomeDrive, ProgramFiles, ProgramFiles(x86),
  ProgramW6432, ProgramData, AllUsersProfile); `%HOMEDRIVE%%HOMEPATH%` becomes `~`. Other variables stay as typed.
- `HostPathVariables.locationOf(name)`: the canonical location, case-insensitively, or `null`.

## Why

Only locations the catalog protects are mapped; expanding everything (as the write-boundary expander does from a
real env) is not needed to decide "is this a system path". Windows stand-ins use `C:` because the catalog matches
Windows locations on any drive.
