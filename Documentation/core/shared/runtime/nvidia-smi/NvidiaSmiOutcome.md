# NvidiaSmiOutcome

`core/shared/runtime/nvidia-smi/NvidiaSmiOutcome.js`

Classifies what happened when nvidia-smi was run, for
[NvidiaSmiStream](../NvidiaSmiStream.md) and [NvidiaSmi.query](../NvidiaSmi.md).
A record is `{ kind, reason, at }`.

## Methods

- Kinds: `none` (nothing read yet), `ok`, `missing` (binary absent, confirmed
  against the on-disk ladder by the stream), `timeout` (killed by the exec
  timeout, or a loop that stopped producing), `exit` (non-zero exit, signal, or
  any other error), `parse` (ran fine but no card rows came out). `KINDS` lists
  them.
- `of(kind, reason, at)`, `none()`, `ok(at)`, `parse(at, reason)`,
  `timeout(at, reason)`, `missing(at, reason)` build records.
- `fromError(err, at)` from an `execFile` or `spawn` error: `ENOENT` (or a "not
  found" message) is `missing`; `killed`, a `signal` or `ETIMEDOUT` is
  `timeout`; a numeric `code` is `exit` with the last stderr line; anything else
  is `exit` with the message. A nullish error is `ok`.
- `fromExit(code, signal, at, stderr)` names the signal or code plus the last
  stderr line.
- `isMissingError(err)`, `isOk(outcome)`, `isDegraded(outcome)` (any kind but
  `ok` and `none`).

## Why

The old runner flattened every failure to `''`, which parsed as "no GPUs". A
hung nvidia-smi then looked exactly like a host without NVIDIA. Only `missing`
is a stable state; every other kind keeps the last reading and recovers on the
next good one.
