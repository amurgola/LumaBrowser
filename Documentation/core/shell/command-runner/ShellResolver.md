# ShellResolver

`core/shell/command-runner/ShellResolver.js`

Decides once per kind which shell a command runs under.

## Methods

- `new ShellResolver({ platform, spawnSync, findGitBash? })`.
- `resolve(kind = 'auto')` cached per kind:
  - Windows: `auto`, `powershell` and `sh` -> pwsh, else Windows PowerShell;
    `bash` -> Git bash when installed, else PowerShell. Git bash is opt-in per call
    because most Windows projects expect PowerShell semantics for their scripts.
  - POSIX: `auto` -> bash when it answers, else sh; `bash` and `powershell` -> bash; `sh` -> sh.
- `ShellResolver.forContainer(at, timeoutMs, env)` the descriptor for a container
  run: `docker` ([DockerExec](../DockerExec.md).dockerBin) with
  [ContainerShell](../ContainerShell.md).execArgv into the container's bash or sh,
  `CI=1` plus `env`, and the timeout in seconds.
