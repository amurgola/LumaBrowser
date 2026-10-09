# KillRequest

`core/shell/shellClassifier/rules/system/KillRequest.js`

Reads a process-killing command into `{ hard, pids, patterns, tree, userWide, filtered, platform }`.

- `KillRequest.parse(command)`: `kill`, `pkill`, `killall`, `taskkill`, `tskill`, `Stop-Process`/`spps`, and `kill`
  in PowerShell (an alias of Stop-Process). `null` for anything else.
- `KillRequest.isHardSignal(signal)`: 9 / KILL / SIGKILL.

POSIX `kill`: the first dash word before any pid is the signal, later dash words are process groups, `--` ends
options, so `kill -9 -1` targets -1 while `kill -1 1234` sends SIGHUP to 1234. pkill's `-s` is a session id,
killall's `-s` a signal. taskkill reads `/F`, `/T`, `/FI`, every `/PID` and `/IM`. Stop-Process and tskill always
terminate outright, so they are hard.
