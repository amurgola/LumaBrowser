# PreflightSysdepsIssue

`core/llm-server/PreflightSysdepsIssue.js`

Builds the Linux `system-libs-missing` [Preflight](Preflight.md) issue: the
known-library check plus `ldd` on every installed runtime binary, reduced to
one plain sentence and one copyable apt line, with each missing library
attributed to the runtime that needs it.

## Methods

- `PreflightSysdepsIssue.collect(sysdeps, services)` (async) returns the issue
  or `null`. Collects every installed runtime with a `binaryPath` from each
  service's `ensureRuntimesView()` (services without it, or whose view throws,
  are skipped), leaving out a runtime whose `hardware.ready` is false unless
  its `backend` check failed (that one is not ready because of missing
  libraries, which the check should name). Then calls
  `sysdeps.preflight({ binaries })` ([SysdepsChecker](../shared/runtime/SysdepsChecker.md))
  for the merged result and, when `sysdeps.checkBinary` exists, one
  `checkBinary` per runtime for the attribution. `null` when `sysdeps` has no
  `preflight`, the call throws, or the result is ok.
  The issue: `{ id: 'system-libs-missing', area: 'system', severity: 'error',
  title, detail, fix: { kind: 'sysdeps', aptLine, packages, missing: [{ soname, pkg|null, hint? }], byRuntime: [{ runtimeId, name, missing }] } }`;
  `detail` is the merged message followed by one sentence per runtime
  ("llama.cpp (SYCL) needs libsycl.so.8 (Intel oneAPI runtime ...).").

The raw loader text (`result.rawLog`) never reaches the issue; the code that
installed the runtime logs it.
