# WindowsUserPath

`core/shell/cli-shim/WindowsUserPath.js`

Reads and edits the Windows per-user PATH (`HKCU\Environment\Path`).

## Methods

- `new WindowsUserPath({ exec? })` where `exec` is `execFile`-shaped (default
  `child_process.execFile`). Commands run hidden with a 30 s timeout.
- `read()` resolves the raw, unexpanded user PATH via `reg query`.
- `add(dir)` resolves true when `dir` was appended, false when already present.
- `remove(dir)` resolves true when entries equal to `dir` were removed.
- A failed command rejects with its stderr (or message).
- `WindowsUserPath.addScript(dir)`, `WindowsUserPath.removeScript(dir)`:
  the PowerShell scripts, tagged `# luma:add` and `# luma:remove`, ending with
  a `changed` or `unchanged` line.
- `WindowsUserPath.parseRegQuery(stdout)` extracts the `REG_SZ` or
  `REG_EXPAND_SZ` value, or `''`.
- `WindowsUserPath.quote(value)` makes a PowerShell single-quoted literal.

## Why

The scripts read the value unexpanded and write it back as `REG_EXPAND_SZ`, so
`%USERPROFILE%`-style entries survive. Add appends to the raw string instead of
rebuilding it, so every other byte (including a trailing `;`) is untouched;
remove keeps empty elements. A `WM_SETTINGCHANGE` broadcast lets new terminals
see the change without a sign-out. Scripts are sent with `-EncodedCommand`
(UTF-16LE base64) to avoid quoting problems.
