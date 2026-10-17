# Win32Shell

`core/desktop/win32/Win32Shell.js`

Opens a program, file, folder or URL the way the Run dialog does, for
`desktop_launch`.

## Methods

- `Win32Shell.open(file, params = null)` calls `ShellExecuteW` with the verb
  `open` and `SW_SHOWNORMAL` ([Win32Api](Win32Api.md) `loadShell()`). Returns
  nothing on success (a value above 32); otherwise throws
  `Windows could not open "<file>": <why>.`, naming the common failures from
  `FAILURES` (not found, access denied, no associated app, ...) or `error <code>`.
- Statics: `SW_SHOWNORMAL`, `FAILURES`.

## Why ShellExecute

App Paths names such as `msedge` or `spotify` resolve as they do in Win+R, and
no command shell ever parses `params`, so an argument cannot chain a second
command. `Win32.shellOpen(file, params)` is the surface DesktopService calls.
