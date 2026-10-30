# TerminalCommandRunner

`core/shared/runtime/install/TerminalCommandRunner.js`

Runs one shell command in a visible terminal emulator, so a command that needs
sudo asks for the password there and never inside the app, and reports how it
ended.

## Methods

- `new TerminalCommandRunner({ spawnFn, fsLike, tmpDir, env, find, platform, pollMs, timeoutMs, startGraceMs, setTimeoutFn })`;
  every option is a seam with a real default (`child_process.spawn`, `fs`,
  `os.tmpdir()`, `process.env`, [PathBinaryLookup](../detect/PathBinaryLookup.md)`.find`).
- `run(command, { title })` resolves `{ ok, code, terminal, error }`: `code` is
  the command's exit code, 130 when the window was closed on it, null when no
  terminal ran it or the wait timed out. Linux only, so the script, status and
  started paths are joined with `path.posix` (they are quoted into a sh script,
  and the tests run on Windows too).
- `TerminalCommandRunner.script(command, { status, started, title })`: the
  bash script the terminal runs: a started marker, the command, its exit code
  written to the status file, a readable summary, then a pause on Enter. An
  EXIT trap writes 130 if the window is closed first.
- `TerminalCommandRunner.quote(text)`: single-quoted for bash.
- `TERMINALS`: konsole, gnome-terminal (`--wait`), ptyxis, xfce4-terminal,
  tilix, mate-terminal, lxterminal, kitty, alacritty, wezterm, foot,
  x-terminal-emulator, xterm, each with its launch arguments; `$TERMINAL`,
  when set and on PATH, is tried first with `-e`.
- Constants `POLL_MS` (500), `TIMEOUT_MS` (30 min), `START_GRACE_MS` (3 s),
  `CLOSED_CODE` (130), `NO_TERMINAL`.

## Why

Terminals differ in whether their own exit status reflects the command's, and
some detach at once, so the outcome comes from a status file the script
writes, polled until it appears. A terminal that exits without the started
marker appearing within the grace period never ran the script (bad
arguments, a refusing wrapper) and is reported as such; one that detached is
simply waited on. The terminal is spawned detached and unreferenced, so it
never holds the app open. No terminal on the host is an answer
(`NO_TERMINAL`), not a throw.
