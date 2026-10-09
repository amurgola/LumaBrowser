# CmdBuiltinCatalog

`core/shell/shellClassifier/rules/readOnly/CmdBuiltinCatalog.js`

[ReadOnlyCatalog](ReadOnlyCatalog.md) for cmd.exe builtins and Windows console tools, using the slash grammar
(`/x` and `-x`, case-insensitive).

- `PLAIN`: dir, type, ver, whoami, hostname, systeminfo, findstr, where, tree, netstat, ... always read.
- `IPCONFIG`: `/release`, `/renew`, `/flushdns`, `/registerdns`, `/setclassid` (and v6 forms) change the network.
- `GPRESULT` (`/h`, `/x`) and `MSINFO32` (`/report`, `/nfo`) write report files.
- `PING`: Windows ping stops after four echoes, so only `/t` (run until stopped) is refused.
- `SORT`: `/o` writes its output file.
- `CLOCK` (`date`, `time`): an operand sets the clock; `/t` prints.
- `SET`: refuses `name=value`. `chcp`, `label`, `path`: read only without arguments.
- `nvidia-smi` shares [SystemQueryProfiles](SystemQueryProfiles.md)`.NVIDIA_SMI`.

## Why

cmd names overlap POSIX ones but behave differently (Windows `ping`, `sort /o`, `hostname`); keeping them in their
own catalog lets each dialect get the right answer.
