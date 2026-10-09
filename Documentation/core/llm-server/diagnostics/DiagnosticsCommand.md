# DiagnosticsCommand

`core/llm-server/diagnostics/DiagnosticsCommand.js`

Runs one external probe command with a timeout and always resolves, so a
missing tool is an answer rather than a throw.

## Methods

- `DiagnosticsCommand.run(cmd, args, timeoutMs = 4000)` resolves
  `{ ok: true, stdout, stderr }` or `{ ok: false, reason, stdout?, stderr? }`.
  A missing binary's reason is `<cmd> not found on PATH`; otherwise the exec
  error message. Hidden window, 4 MB output buffer. Settles once even when
  both the spawn `error` event and the callback fire.
- `DiagnosticsCommand.isBinaryMissing(reason)` is true for `not found`,
  `ENOENT` or `cannot find`; the probes use it to decide whether a fallback
  (next PowerShell host, nvidia-smi on disk) is worth trying.
- `TIMEOUT_MS` (4000), `MAX_BUFFER_BYTES`.

Similar to [SysdepsCommandRunner](../../shared/runtime/SysdepsCommandRunner.md),
but with the `reason` field every diagnostics probe reports.
