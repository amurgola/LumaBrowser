# ContainerShell

`core/shell/ContainerShell.js`

Picks the shell a command runs under inside a Docker container and builds the `docker exec` argv that runs it.

## Methods

- `ContainerShell.shellFor(container)` returns `ContainerShell.BASH` when the container has bash, else
  `ContainerShell.SH` (`{ name, file, syntax }`, frozen). Probed once per container and cached.
- `ContainerShell.execArgv({ container, posixCwd, command, env, timeoutSec, shell })` returns
  `['exec', '-w', posixCwd, '-e', 'K=V'..., container, 'sh', '-c', TIMEOUT_GUARD, <seconds>, shell.file, '-c', command]`.
  Seconds are rounded up and never below 1.
- `ContainerShell.reset()` clears the probe cache (tests).

## Why

Killing the local docker client does not stop the process it started on the other side, so the deadline must run in
the container: the guard wraps the command in the container's own `timeout -s KILL` when it has one.
