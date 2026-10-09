# ProcessCleanup

`tools/dev/ProcessCleanup.js`

Reaps what tests or a dev session left behind (`npm run cleanup`, thin entry `scripts/cleanup.js`):

- Electron: Windows `tasklist` for `electron.exe`, then `taskkill /f /im electron.exe`; elsewhere
  `pgrep -f electron`, then `kill -9 <pids>`. The installed app runs as `LumaBrowser.exe` and is not matched on
  Windows; `pgrep -f electron` on Linux/macOS matches any command line containing "electron".
- Ports 3000 (dev) and 3001 (tests): only the process LISTENING on exactly that port, found with
  [PortListenerParser](PortListenerParser.md) (`netstat -ano -p tcp` on Windows, `lsof -ti tcp:<port> -sTCP:LISTEN`
  elsewhere). Never connection peers (WebStorm's cef_server on localhost:30000 was once force-killed by a substring
  match), PID 0 or the calling process (the unit suite runs Jest in-process).

`dryRun` (`--dry-run` on the entry) runs the listing commands but prints `(dry run) would run: <command>` instead
of killing. A failed kill prints "Some processes may still be running". `execute` answers 0, or 1 when something
throws. A test-run teardown should call `killNodeProcessesOnPort(3001, false)` only, and skip
`killElectronProcesses` when `ELECTRON_RUN_AS_NODE` is set (the runner is itself Electron).

## Methods

- `new ProcessCleanup({ run, platform, selfPid, log, dryRun })` (`run(command)` resolves `{ error, stdout }`;
  defaults to `child_process.exec`).
- `execute()`, `killElectronProcesses(verbose = true)`, `killNodeProcessesOnPort(port = 3000, verbose = true)`.
- Constants: `PORTS` (`[3000, 3001]`).
