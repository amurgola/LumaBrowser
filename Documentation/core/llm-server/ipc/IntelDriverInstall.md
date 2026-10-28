# IntelDriverInstall

`core/llm-server/ipc/IntelDriverInstall.js`

The Intel driver install the Setup page offers on Linux: the plan, then the
run in a visible terminal where sudo asks for the password, then a forced
re-probe.

## Methods

- `new IntelDriverInstall({ llmServerService, probes?, terminal?, platform?, proc?, fsLike?, log? })`;
  `probes.intel` and `probes.distro` default to
  [IntelComputeRuntime](../../shared/runtime/detect/IntelComputeRuntime.md)`.probe`
  and [LinuxDistro](../../shared/runtime/detect/LinuxDistro.md)`.probe`,
  `terminal` to a [TerminalCommandRunner](../../shared/runtime/install/TerminalCommandRunner.md).
- `plan()` resolves `{ plan }`: an [IntelDriverPlan](../../shared/runtime/detect/IntelDriverPlan.md)
  from the cached diagnostics (the Intel adapter and the NPU list, via
  [NpuProbe](../diagnostics/NpuProbe.md)`.hasIntelNpu`), fresh file-system
  probes, and the user's `render` group membership (`/etc/group` against
  `process.getgroups()`, null when unknown).
- `install()` resolves `{ ran, ok, code, terminal, error, plan }`: it runs
  exactly the command `plan()` shows, titled `TITLE`. A plan with no command
  (nothing missing, or a distribution with no packaged driver) answers with
  `ran: false` and the reason. After a successful run the diagnostics are
  re-probed (`ensureDiagnostics({ force: true })`) and the runtimes cache
  dropped, and the returned `plan` is the new one, so the page can show what
  is still missing.

## Why

The user sees the plan before anything runs, and the install runs only that.
Both caches are rebuilt afterwards because the hardware pills (runtimes view)
and the NPU row (diagnostics) are what the page uses to show the change.
